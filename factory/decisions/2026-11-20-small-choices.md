# Small choices made by the decision maker, 2026-11-20

Phi-3.5 mini, standard method, equal weights, reversible and medium stakes. Each is a real choice for the Say It Kindly app, not a test.

| Choice | Result | Margin | Applied |
|---|---|---|---|
| Mascot | **Rabbit** 85, Bear 70, Owl 45 | 15 | Yes. The front page shows a rabbit for the app. (A bear had been picked by hand before the tool was asked.) |
| Button label after the check | **Copy message** 100, Copy my message 86.7, Copy and send 40 | 13.3 | Already the label. Confirmed on a second look by Qwen2.5 7B, deep: 86.7, 66.7, 33.3 |
| English name | **Say It Kindly** 91.4, Say It Gently 71.4, Softer Words 51.4 | 20 | Already the name |
| Fourth app (Plain Steps, Second Look, Five-Minute Teacher) | **Second Look** 75, Plain Steps 70, Five-Minute Teacher 65. Weights could not be set by the model, so equal | 5 | Queued as the next backlog item for tomorrow's run to confirm with a fresh decision. A different run of the same model put Plain Steps well ahead (96 to 64), so this one is not settled |

Read the last row as a warning: the same model gave opposite orders on the same two concepts in two runs. For choices that cost a day of building, ask more than once, or raise `escalateBelow`.
