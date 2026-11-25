"""Make the 80/10/10 split of the 300 hand-labeled recipes (run once).

    python make_split.py path/to/recipes_fixed.json

Writes
  data/train.json            240 recipes (80%)  -> the notebook trains on these
  data/tune.json              30 recipes (10%)  -> the notebook tunes on these
  data/split_ids.json        which ids went where (train + tune only)
  data/holdout/holdout.json   30 recipes (10%)  -> DO NOT LOAD UNTIL FINAL EVAL
  data/holdout/holdout_ids.json

The split is stratified on the cultural relevance score (0-5), so every score
appears in each part in about the same proportion, and uses a fixed seed so it
is reproducible. The script prints nothing about the held-out recipes.
"""
import json
import os
import sys

from sklearn.model_selection import train_test_split

SEED = 202
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
HOLDOUT = os.path.join(DATA, "holdout")


def write(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main(src):
    recipes = json.load(open(src, encoding="utf-8"))
    recipes = [r for r in recipes if (r.get("cultural relevance") or {}).get("score") is not None]
    assert len(recipes) == 300, f"expected 300 labeled recipes, got {len(recipes)}"
    scores = [r["cultural relevance"]["score"] for r in recipes]

    # 80% train, then split the remaining 20% in half: 10% tune, 10% holdout
    train, rest, _, rest_scores = train_test_split(
        recipes, scores, test_size=0.2, stratify=scores, random_state=SEED)
    tune, holdout = train_test_split(
        rest, test_size=0.5, stratify=rest_scores, random_state=SEED)

    by_id = lambda rs: sorted(rs, key=lambda r: r["id"])
    train, tune, holdout = by_id(train), by_id(tune), by_id(holdout)

    os.makedirs(HOLDOUT, exist_ok=True)
    write(os.path.join(DATA, "train.json"), train)
    write(os.path.join(DATA, "tune.json"), tune)
    write(os.path.join(DATA, "split_ids.json"), {
        "seed": SEED,
        "stratified_on": "cultural relevance score (0-5)",
        "train": [r["id"] for r in train],
        "tune": [r["id"] for r in tune],
        "holdout": "see holdout/holdout_ids.json (not loaded by the notebook)",
    })
    write(os.path.join(HOLDOUT, "holdout.json"), holdout)
    write(os.path.join(HOLDOUT, "holdout_ids.json"), {"seed": SEED, "holdout": [r["id"] for r in holdout]})

    print(f"train: {len(train)}  tune: {len(tune)}  holdout: {len(holdout)} (not inspected)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "web", "public", "recipes.json"))
