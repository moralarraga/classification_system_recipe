# Cultural relevance classifier

HW3's bag-of-words logistic regression, adapted to the 300 hand-labeled recipes.

- `recipe_classifier.ipynb`: the notebook. Loads only `data/train.json` (240) and `data/tune.json` (30).
- `make_split.py`: made the 80/10/10 split once (seed 202, stratified on the 0-5 score). Re-running it gives the same split.
- `data/split_ids.json`: which ids are train and tune.
- `data/holdout/`: **the 30 sealed held-out recipes. Do not load until final evaluation.** This applies to every experiment (classification, clustering, IR evaluation). See `data/holdout/README.md`.

Note: `web/public/recipes.json` still holds all 300 recipes (for the site). Any experiment that reads it must drop the ids in `data/holdout/holdout_ids.json`.

## Run
    pip install scikit-learn pandas matplotlib jupyter
    cd classifier
    jupyter notebook recipe_classifier.ipynb

In Colab, upload `recipe_classifier.ipynb` plus `data/train.json` and `data/tune.json` into a `data/` folder. Don't upload the holdout folder until final testing.
