import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load CSVs (first column is disease/symptom name)
severity_df = pd.read_csv('symptom_severity.csv', header=None)
description_df = pd.read_csv('symptom_Description.csv', header=None)
precaution_df = pd.read_csv('symptom_precaution.csv', header=None)

# Rename columns
severity_df.columns = ['symptom', 'weight']
description_df.columns = ['disease', 'description']
precaution_df.columns = ['disease', 'precaution1', 'precaution2', 'precaution3', 'precaution4']

print("Severity DF:\n", severity_df.head())
print("Description DF:\n", description_df.head())
print("Precaution DF:\n", precaution_df.head())

# Build symptom list
symptom_list = list(severity_df['symptom'].str.strip())
symptom_weight_map = dict(zip(severity_df['symptom'].str.strip(), severity_df['weight']))

# Example: create synthetic feature dataset (replace with real mapping if available)
diseases = description_df['disease'].unique()
rows = []

np.random.seed(42)
for disease in diseases:
    chosen_symptoms = np.random.choice(symptom_list, size=5, replace=False)
    feature_vector = np.zeros(len(symptom_list))
    for s in chosen_symptoms:
        feature_vector[symptom_list.index(s)] = symptom_weight_map[s]
    rows.append([disease] + list(feature_vector))

df = pd.DataFrame(rows, columns=['disease'] + symptom_list)

# Train-test split
X = df.drop('disease', axis=1)
y = df['disease']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = DecisionTreeClassifier()
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))

# Example prediction
sample_input = ["itching", "skin rash"]
input_vector = np.zeros(len(symptom_list))
for s in sample_input:
    if s in symptom_list:
        input_vector[symptom_list.index(s)] = symptom_weight_map[s]
predicted_disease = model.predict([input_vector])[0]
print("Predicted Disease:", predicted_disease)
