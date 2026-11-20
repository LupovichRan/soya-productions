#!/usr/bin/env bash
# Soyactory: one-time Google Cloud set-up for the model server.
#
# Run it in Google Cloud Shell (https://shell.cloud.google.com), signed in as the owner of the project.
# READ IT FIRST. It is short and changes only what is listed below. It is safe to run twice.
#
# It does, in order:
#   1. turns on the Cloud Run, Artifact Registry, Secret Manager and sign-in services
#   2. creates a Docker repository named "soya" for the model server image
#   3. creates a secret "soya-decider-key" holding a new long random key (never printed)
#   4. creates two service accounts: one that deploys, one the server runs as
#   5. lets the runtime account read that one secret and nothing else
#   6. lets GitHub (only this repository, only its main branch) act as the deploy account, with no stored key
#   7. optionally sets a budget alert, if you give it a billing account
#
# It deletes nothing and sets nothing public. At the end it prints four values to paste into GitHub.
#
# Usage:
#   PROJECT_ID=my-project bash gcp-setup.sh
#   PROJECT_ID=my-project BILLING_ACCOUNT=012345-6789AB-CDEF01 bash gcp-setup.sh     (adds a $1 budget alert)
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${REGION:-us-central1}"
REPO="${GITHUB_REPO:-LupovichRan/soya-productions}"     # change if the repository is renamed
BRANCH="${GITHUB_BRANCH:-main}"
BILLING_ACCOUNT="${BILLING_ACCOUNT:-}"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
  echo "Say which project to use:  PROJECT_ID=your-project-id bash gcp-setup.sh" >&2
  echo "Your projects:" >&2; gcloud projects list --format="value(projectId)" >&2
  exit 1
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
DEPLOYER="soya-deployer"
RUNTIME="soya-decider-runtime"
DEPLOYER_EMAIL="${DEPLOYER}@${PROJECT_ID}.iam.gserviceaccount.com"
RUNTIME_EMAIL="${RUNTIME}@${PROJECT_ID}.iam.gserviceaccount.com"
SECRET="soya-decider-key"
POOL="github"
PROVIDER="soyactory"

echo "Project: $PROJECT_ID ($PROJECT_NUMBER), region $REGION, repository $REPO, branch $BRANCH"

echo "1/7 Turning on services"
gcloud services enable --project "$PROJECT_ID" \
  run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com

echo "2/7 Docker repository"
gcloud artifacts repositories describe soya --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1 \
  || gcloud artifacts repositories create soya --repository-format=docker --location "$REGION" --project "$PROJECT_ID" \
       --description "Soyactory model server images"

echo "3/7 Secret (a new random key; it is not printed)"
if ! gcloud secrets describe "$SECRET" --project "$PROJECT_ID" >/dev/null 2>&1; then
  openssl rand -base64 48 | tr -d '\n' | gcloud secrets create "$SECRET" --project "$PROJECT_ID" --replication-policy=automatic --data-file=-
else
  echo "    already exists, left alone"
fi

echo "4/7 Service accounts"
for sa in "$DEPLOYER" "$RUNTIME"; do
  gcloud iam service-accounts describe "${sa}@${PROJECT_ID}.iam.gserviceaccount.com" --project "$PROJECT_ID" >/dev/null 2>&1 \
    || gcloud iam service-accounts create "$sa" --project "$PROJECT_ID" --display-name "Soyactory $sa"
done

echo "5/7 Permissions, as narrow as they go"
# The server may read its one secret, and nothing else.
gcloud secrets add-iam-policy-binding "$SECRET" --project "$PROJECT_ID" \
  --member "serviceAccount:$RUNTIME_EMAIL" --role roles/secretmanager.secretAccessor --condition=None >/dev/null
# The deployer may deploy Cloud Run services and push images to the one repository...
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member "serviceAccount:$DEPLOYER_EMAIL" --role roles/run.admin --condition=None >/dev/null
gcloud artifacts repositories add-iam-policy-binding soya --location "$REGION" --project "$PROJECT_ID" \
  --member "serviceAccount:$DEPLOYER_EMAIL" --role roles/artifactregistry.writer >/dev/null
# ...and may run a service as the runtime account, but not as anything else.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_EMAIL" --project "$PROJECT_ID" \
  --member "serviceAccount:$DEPLOYER_EMAIL" --role roles/iam.serviceAccountUser >/dev/null

echo "6/7 Letting GitHub deploy without a stored key (only $REPO on $BRANCH)"
gcloud iam workload-identity-pools describe "$POOL" --location global --project "$PROJECT_ID" >/dev/null 2>&1 \
  || gcloud iam workload-identity-pools create "$POOL" --location global --project "$PROJECT_ID" --display-name "GitHub"
gcloud iam workload-identity-pools providers describe "$PROVIDER" --workload-identity-pool "$POOL" --location global --project "$PROJECT_ID" >/dev/null 2>&1 \
  || gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --workload-identity-pool "$POOL" --location global --project "$PROJECT_ID" \
       --issuer-uri "https://token.actions.githubusercontent.com" \
       --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
       --attribute-condition "assertion.repository=='${REPO}' && assertion.ref=='refs/heads/${BRANCH}'"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_EMAIL" --project "$PROJECT_ID" \
  --member "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${REPO}" \
  --role roles/iam.workloadIdentityUser >/dev/null

echo "7/7 Budget alert"
if [ -n "$BILLING_ACCOUNT" ]; then
  gcloud services enable billingbudgets.googleapis.com --project "$PROJECT_ID"
  gcloud billing budgets create --billing-account "$BILLING_ACCOUNT" --display-name "Soyactory: tell me at \$1" \
    --budget-amount 1USD --filter-projects "projects/${PROJECT_ID}" \
    --threshold-rule percent=0.5 --threshold-rule percent=1.0 || echo "    could not create the budget; set one by hand at https://console.cloud.google.com/billing/budgets"
else
  echo "    skipped. Set one by hand (it takes a minute): https://console.cloud.google.com/billing/budgets"
fi

PROVIDER_NAME="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"
cat <<DONE

Done. Paste these four values into GitHub as repository VARIABLES (they are names, not secrets):
  https://github.com/${REPO}/settings/variables/actions

  GCP_PROJECT_ID                  ${PROJECT_ID}
  GCP_WORKLOAD_IDENTITY_PROVIDER  ${PROVIDER_NAME}
  GCP_DEPLOY_SERVICE_ACCOUNT      ${DEPLOYER_EMAIL}
  GCP_RUNTIME_SERVICE_ACCOUNT     ${RUNTIME_EMAIL}

Then in GitHub: Settings, Environments, New environment "model-server", add yourself as a required reviewer.
Then run the "Deploy model server" workflow from the Actions tab.

The access key lives only in Secret Manager. To read it once, to give to the decision maker through a secure form:
  gcloud secrets versions access latest --secret ${SECRET} --project ${PROJECT_ID}
DONE
