# DO NOT LOAD UNTIL FINAL EVAL

These 30 recipes (10% of the 300 hand-labeled ones) are the held-out test set.

- **Sealed for ALL tests and experiments** (Lilia, 2026-11-25), not just the
  classifier: the clustering experiment, the BM25/IR evaluation and anything
  else. Every experiment uses only `train.json` and `tune.json` (or excludes
  the ids in `holdout_ids.json`) until Lilia says it is time for final testing.
- The notebook does not read anything in this folder. Its only way in is the
  `FINAL_EVAL` cell at the very end, which stays off (`FINAL_EVAL = False`)
  until Lilia is completely done tuning.
- Do not open `holdout.json`, compute stats on it, or look at its labels.
- After the final evaluation runs, do not go back and tune again: that would
  make the held-out score meaningless.
