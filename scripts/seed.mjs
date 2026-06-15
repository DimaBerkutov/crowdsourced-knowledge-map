// Seeds the knowledge map with a starter graph (Machine Learning / Data Science).
// Uses the service-role key, which bypasses RLS, and leaves created_by = null.
// Usage: node --env-file=.env.local scripts/seed.mjs
//        node --env-file=.env.local scripts/seed.mjs --reset   (wipes km_* first)
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const reset = process.argv.includes("--reset");
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- Node definitions. `key` is a local handle used to declare edges. --------
const nodes = [
  { key: "ds",        type: "concept",  title: "Data Science", content: "An interdisciplinary field for extracting knowledge from data." },
  { key: "ml",        type: "concept",  title: "Machine Learning", content: "Algorithms that learn from data instead of being explicitly programmed." },
  { key: "stats",     type: "concept",  title: "Statistics", content: "The mathematical foundation for analyzing and interpreting data." },
  { key: "prob",      type: "concept",  title: "Probability Theory", content: "The study of random events and their regularities." },
  { key: "bayes",     type: "fact",     title: "Bayes' Theorem", content: "P(A|B) = P(B|A)·P(A) / P(B). Relates conditional probabilities." },
  { key: "linalg",    type: "concept",  title: "Linear Algebra", content: "Vectors, matrices, and their transformations — the basis of ML computation." },
  { key: "calculus",  type: "concept",  title: "Calculus", content: "Derivatives and gradients that underpin optimization." },

  { key: "supervised",   type: "concept", title: "Supervised Learning", content: "A model learns from labeled examples (input → answer)." },
  { key: "unsupervised", type: "concept", title: "Unsupervised Learning", content: "Finding structure in unlabeled data." },
  { key: "reinforcement",type: "concept", title: "Reinforcement Learning", content: "An agent learns through rewards for actions in an environment." },

  { key: "regression",   type: "concept", title: "Regression", content: "Predicting a continuous value." },
  { key: "classification",type:"concept", title: "Classification", content: "Assigning an object to one of several categories." },
  { key: "clustering",   type: "concept", title: "Clustering", content: "Grouping similar objects without labels." },

  { key: "linreg",    type: "concept",  title: "Linear Regression", content: "Models a relationship as a linear combination of features." },
  { key: "logreg",    type: "concept",  title: "Logistic Regression", content: "A linear model for binary classification via the sigmoid function." },
  { key: "tree",      type: "concept",  title: "Decision Tree", content: "A hierarchy of if/else conditions used for prediction." },
  { key: "forest",    type: "concept",  title: "Random Forest", content: "An ensemble of decision trees that reduces overfitting." },
  { key: "kmeans",    type: "concept",  title: "K-Means", content: "A clustering algorithm based on k centroids." },
  { key: "nn",        type: "concept",  title: "Neural Networks", content: "Layers of neurons trained by backpropagation." },
  { key: "deep",      type: "concept",  title: "Deep Learning", content: "Neural networks with many layers." },

  { key: "gd",        type: "concept",  title: "Gradient Descent", content: "Iteratively minimizing a loss function along its gradient." },
  { key: "loss",      type: "concept",  title: "Loss Function", content: "A measure of prediction error that the model minimizes." },
  { key: "overfit",   type: "concept",  title: "Overfitting", content: "A model memorizes training noise and generalizes poorly." },
  { key: "regular",   type: "concept",  title: "Regularization", content: "A penalty on model complexity to combat overfitting." },
  { key: "cv",        type: "concept",  title: "Cross-Validation", content: "Evaluating model quality across multiple data splits." },
  { key: "features",  type: "concept",  title: "Feature Engineering", content: "Creating informative features from raw data." },

  { key: "q_data",    type: "question", title: "How much data is needed to train a model?", content: "It depends on task complexity and the number of model parameters." },
  { key: "q_blackbox",type: "question", title: "Can a black-box model be trusted?", content: "Model interpretability is an open problem." },

  { key: "elements",  type: "resource", title: "The Elements of Statistical Learning", content: "The classic textbook by Hastie, Tibshirani, and Friedman." },
  { key: "sklearn",   type: "resource", title: "scikit-learn", content: "A Python library for classical ML." },
];

// --- Edge definitions: [sourceKey, relation, targetKey]. ----------------------
const edges = [
  ["ml", "part_of", "ds"],
  ["stats", "part_of", "ds"],
  ["ml", "depends_on", "stats"],
  ["ml", "depends_on", "linalg"],
  ["ml", "depends_on", "calculus"],
  ["stats", "depends_on", "prob"],
  ["bayes", "part_of", "prob"],
  ["bayes", "supports", "logreg"],

  ["supervised", "part_of", "ml"],
  ["unsupervised", "part_of", "ml"],
  ["reinforcement", "part_of", "ml"],

  ["regression", "part_of", "supervised"],
  ["classification", "part_of", "supervised"],
  ["clustering", "part_of", "unsupervised"],

  ["linreg", "part_of", "regression"],
  ["logreg", "part_of", "classification"],
  ["tree", "part_of", "classification"],
  ["forest", "depends_on", "tree"],
  ["forest", "supports", "classification"],
  ["kmeans", "part_of", "clustering"],
  ["nn", "relates_to", "classification"],
  ["deep", "depends_on", "nn"],

  ["linreg", "depends_on", "gd"],
  ["nn", "depends_on", "gd"],
  ["gd", "depends_on", "calculus"],
  ["gd", "depends_on", "loss"],

  ["regular", "contradicts", "overfit"],
  ["cv", "supports", "overfit"],          // cv helps detect overfitting
  ["forest", "contradicts", "overfit"],
  ["features", "supports", "supervised"],

  ["q_data", "relates_to", "overfit"],
  ["q_blackbox", "relates_to", "deep"],
  ["q_blackbox", "contradicts", "tree"],  // decision trees are interpretable

  ["elements", "relates_to", "ml"],
  ["sklearn", "relates_to", "supervised"],
  ["sklearn", "relates_to", "unsupervised"],
];

async function main() {
  if (reset) {
    console.log("Resetting km_edges and km_nodes…");
    await supabase.from("km_edges").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("km_nodes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  // Insert nodes, capturing generated ids back onto their local keys.
  const rows = nodes.map((n) => ({ title: n.title, content: n.content, type: n.type }));
  const { data: inserted, error: nodeErr } = await supabase
    .from("km_nodes")
    .insert(rows)
    .select("id, title");
  if (nodeErr) {
    console.error("Node insert failed:", nodeErr.message);
    process.exit(1);
  }

  const idByTitle = new Map(inserted.map((r) => [r.title, r.id]));
  const idByKey = new Map(nodes.map((n) => [n.key, idByTitle.get(n.title)]));
  console.log(`Inserted ${inserted.length} nodes.`);

  // Build edge rows, skipping any that reference an unknown key.
  const edgeRows = [];
  for (const [src, rel, tgt] of edges) {
    const source_id = idByKey.get(src);
    const target_id = idByKey.get(tgt);
    if (!source_id || !target_id) {
      console.warn(`Skipping edge ${src} -[${rel}]-> ${tgt}: missing node.`);
      continue;
    }
    edgeRows.push({ source_id, target_id, relation_type: rel });
  }

  const { data: insEdges, error: edgeErr } = await supabase
    .from("km_edges")
    .insert(edgeRows)
    .select("id");
  if (edgeErr) {
    console.error("Edge insert failed:", edgeErr.message);
    process.exit(1);
  }
  console.log(`Inserted ${insEdges.length} edges.`);
  console.log("✓ Seed complete.");
}

main();
