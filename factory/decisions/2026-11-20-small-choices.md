# Small choices made by the decision maker, 2026-11-20

Phi-3.5 mini, standard method, equal weights, reversible and medium stakes. Each is a real choice for the Say It Kindly app, not a test.

| Choice | Result | Margin | Applied |
|---|---|---|---|
| Mascot | **Rabbit** 85, Bear 70, Owl 45 | 15 | Yes. The front page shows a rabbit for the app. (A bear had been picked by hand before the tool was asked.) |
| Button label after the check | **Copy message** 100, Copy my message 86.7, Copy and send 40 | 13.3 | Already the label. Confirmed on a second look by Qwen2.5 7B, deep: 86.7, 66.7, 33.3 |
| English name | **Say It Kindly** 91.4, Say It Gently 71.4, Softer Words 51.4 | 20 | Already the name |
| Fourth app (Plain Steps, Second Look, Five-Minute Teacher) | **Plain Steps.** First tried once on Phi with fallback weights and four criteria: Second Look 75, Plain Steps 70 (margin 5). Then six runs with five equal-weight criteria: Phi three times and Qwen2.5 7B three times, **Plain Steps first in all six** (totals 80 to 100, Second Look 64 to 76, Five-Minute Teacher 36 to 52) | 4 to 32 | Settled: Plain Steps is queued next. The first run's Second Look result came from a different setup and is overruled by the six |

Read the last row as a lesson in how this was settled: one run gave Second Look, and six more runs on two models gave Plain Steps every time. A single run is not enough for a choice that costs a day of building. Ask several times, on more than one model, or raise `escalateBelow`.
