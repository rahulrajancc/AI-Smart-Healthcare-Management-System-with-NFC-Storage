import pandas as pd

precautions_df = pd.read_csv('symptom_precaution.csv')
description_df = pd.read_csv('symptom_Description.csv')
severity_df = pd.read_csv('symptom_severity.csv')

print(precautions_df.head())
print(description_df.head())
print(severity_df.head())
