import re
import pandas as pd
import pyttsx3
from sklearn import preprocessing
from sklearn.tree import DecisionTreeClassifier,_tree
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_val_score
from sklearn.svm import SVC
import csv
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
import requests
import time
import os


training = pd.read_csv('Data/Training.csv')
testing= pd.read_csv('Data/Testing.csv')
cols= training.columns
cols= cols[:-1]
x = training[cols]
y = training['prognosis']
y1= y


reduced_data = training.groupby(training['prognosis']).max()

#mapping strings to numbers
le = preprocessing.LabelEncoder()
le.fit(y)
y = le.transform(y)


x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.33, random_state=42)
testx    = testing[cols]
testy    = testing['prognosis']  
testy    = le.transform(testy)


clf1  = DecisionTreeClassifier()
clf = clf1.fit(x_train,y_train)
# print(clf.score(x_train,y_train))
# print ("cross result========")
scores = cross_val_score(clf, x_test, y_test, cv=3)
# print (scores)
print (scores.mean())


model=SVC()
model.fit(x_train,y_train)
print("for svm: ")
print(model.score(x_test,y_test))

importances = clf.feature_importances_
indices = np.argsort(importances)[::-1]
features = cols

def readn(nstr):
    engine = pyttsx3.init()

    engine.setProperty('voice', "english+f5")
    engine.setProperty('rate', 130)

    engine.say(nstr)
    engine.runAndWait()
    engine.stop()


severityDictionary=dict()
description_list = dict()
precautionDictionary=dict()

symptoms_dict = {}

for index, symptom in enumerate(x):
       symptoms_dict[symptom] = index
def calc_condition(exp,days):
    sum=0
    for item in exp:
         sum=sum+severityDictionary[item]
    if((sum*days)/(len(exp)+1)>13):
        print("You should take the consultation from doctor. ")
    else:
        print("It might not be that bad but you should take precautions.")


def getDescription():
    global description_list
    with open('./MasterData/symptom_Description.csv') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        line_count = 0
        for row in csv_reader:
            _description={row[0]:row[1]}
            description_list.update(_description)




def getSeverityDict():
    global severityDictionary
    with open('./MasterData/symptom_severity.csv') as csv_file:

        csv_reader = csv.reader(csv_file, delimiter=',')
        line_count = 0
        try:
            for row in csv_reader:
                _diction={row[0]:int(row[1])}
                severityDictionary.update(_diction)
        except:
            pass


def getprecautionDict():
    global precautionDictionary
    with open('./MasterData/symptom_precaution.csv') as csv_file:

        csv_reader = csv.reader(csv_file, delimiter=',')
        line_count = 0
        for row in csv_reader:
            _prec={row[0]:[row[1],row[2],row[3],row[4]]}
            precautionDictionary.update(_prec)


def getInfo():
    print("-----------------------------------HealthCare ChatBot-----------------------------------")
    # Skip asking for a name in automated / remote mode
    print("Hello — starting HealthCare ChatBot")

def check_pattern(dis_list, inp):
    """
    Match input against symptom list intelligently.
    Priority: 
    1. Try exact multi-word match
    2. Try matching all input words together (all words must match)
    3. Try matching individual keywords
    """
    pred_list = []
    if not isinstance(inp, str):
        return 0, []
    
    norm = inp.strip()
    if not norm:
        return 0, []
    
    # Common filler words to ignore
    filler_words = {'a', 'i', 'the', 'an', 'in', 'and', 'or', 'is', 'am', 'are', 'have', 'has', 'my', 'me', 'from', 'to', 'with', 'at', 'for'}
    
    # Extract meaningful words (filter out fillers)
    words = [w for w in norm.lower().split() if w not in filler_words and len(w) > 1]
    
    if not words:
        return 0, []
    
    # First, try exact multi-word match (with underscores)
    multi_word_norm = norm.replace(' ', '_')
    patt = re.escape(multi_word_norm)
    regexp = re.compile(patt, re.IGNORECASE)
    exact_matches = [item for item in dis_list if regexp.search(item)]
    
    if len(exact_matches) > 0:
        return 1, exact_matches
    
    # Second, try matching all words together (all must be present in symptom)
    all_word_matches = []
    for symptom in dis_list:
        symptom_lower = symptom.lower()
        # Check if all input words appear in this symptom
        if all(word in symptom_lower for word in words):
            all_word_matches.append(symptom)
    
    if len(all_word_matches) > 0:
        return 1, all_word_matches
    
    # Third, try matching individual words (any word match)
    keyword_matches = []
    for word in words:
        patt = re.escape(word)
        regexp = re.compile(patt, re.IGNORECASE)
        matches = [item for item in dis_list if regexp.search(item)]
        for match in matches:
            if match not in keyword_matches:
                keyword_matches.append(match)
    
    if len(keyword_matches) > 0:
        return 1, keyword_matches
    
    # If still no match, return empty
    return 0, []
def sec_predict(symptoms_exp):
    df = pd.read_csv('./Data/Training.csv')
    X = df.iloc[:, :-1]
    y = df['prognosis']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=20)
    rf_clf = DecisionTreeClassifier()
    rf_clf.fit(X_train, y_train)

    symptoms_dict = {symptom: index for index, symptom in enumerate(X)}
    input_vector = np.zeros(len(symptoms_dict))
    for item in symptoms_exp:
      input_vector[[symptoms_dict[item]]] = 1

    return rf_clf.predict([input_vector])


def print_disease(node):
    node = node[0]
    val  = node.nonzero() 
    disease = le.inverse_transform(val[0])
    return list(map(lambda x:x.strip(),list(disease)))


def _get_server_base():
    return os.environ.get('MEDAI_SERVER', 'http://localhost:2000')


def send_prompt_remote(prompt, timeout=120, interval=1):
    """Send a prompt to the Express relay and poll for a response.

    Returns the response string or None on timeout/error.
    """
    base = _get_server_base()
    try:
        r = requests.post(f"{base}/api/prompt", json={"prompt": prompt}, timeout=5)
        r.raise_for_status()
        pid = r.json().get('id')
        if not pid:
            return None
        start = time.time()
        while time.time() - start < timeout:
            rr = requests.get(f"{base}/api/response/{pid}", timeout=5)
            if rr.status_code == 200:
                return rr.json().get('response')
            elif rr.status_code == 204:
                time.sleep(interval)
                continue
            else:
                rr.raise_for_status()
        return None
    except Exception as e:
        print('[MEDAI] remote error:', e)
        return None


def get_user_input(prompt_msg='', expect_int=False):
    # Try remote first, wrapping the prompt in doctor voice for the frontend
    try:
        formatted_prompt = f"Doctor: {prompt_msg}"
        remote = send_prompt_remote(formatted_prompt)
        if remote is not None:
            # normalize remote replies
            remote_str = str(remote).strip()
            print(f"[remote reply] {remote_str}")
            if expect_int:
                try:
                    return int(remote_str)
                except Exception:
                    # fallthrough to local input
                    pass
            return remote_str.lower()
    except Exception:
        pass
    # fallback to local input
    if expect_int:
        return int(input(prompt_msg))
    return input(prompt_msg)


def send_notification_remote(message_text):
    """Post a notification prompt to the relay so the frontend displays it (fire-and-forget)."""
    base = _get_server_base()
    try:
        formatted = f"Doctor: {message_text}"
        requests.post(f"{base}/api/prompt", json={"prompt": formatted}, timeout=3)
    except Exception as e:
        print('[MEDAI] notification send error:', e)

def tree_to_code(tree, feature_names):
    tree_ = tree.tree_
    feature_name = [
        feature_names[i] if i != _tree.TREE_UNDEFINED else "undefined!"
        for i in tree_.feature
    ]

    chk_dis=",".join(feature_names).split(",")
    symptoms_present = []

    while True:

        disease_input = get_user_input("Please describe the main symptom you are experiencing.(Example: i  have a headache)")
        conf,cnf_dis=check_pattern(chk_dis,disease_input)
        if conf==1:
            # If only one match, automatically select it
            if len(cnf_dis) == 1:
                disease_input = cnf_dis[0]
                print(f"Found match: {disease_input.replace('_', ' ')}")
                break
            
            # Multiple matches: send list to frontend for user selection
            options_lines = [f"I found several possible matches for '{disease_input}'. Which of these best describes what you meant? Reply with the number (0 - {len(cnf_dis)-1}):"]
            for num, it in enumerate(cnf_dis):
                pretty = it.replace('_', ' ')
                options_lines.append(f"{num} ) {pretty}")
            max_index = len(cnf_dis) - 1
            options_lines.append(f"Select the one you meant (0 - {max_index}):")
            options_text = "\n".join(options_lines)
            # Ask remote (or local) for the selection index (doctor-style prompt)
            conf_inp = get_user_input(options_text + " ", expect_int=True)
            # Bound check
            try:
                if conf_inp < 0 or conf_inp > max_index:
                    conf_inp = 0
            except Exception:
                conf_inp = 0
            disease_input = cnf_dis[conf_inp]
            break
            # print("Did you mean: ",cnf_dis,"?(yes/no) :",end="")
            # conf_inp = input("")
            # if(conf_inp=="yes"):
            #     break
        else:
            print("Enter valid symptom.")
            continue

    while True:
        try:
            num_days = get_user_input("How many days have you been experiencing this symptom? (example: 3)", expect_int=True)
            break
        except:
            print("Please provide the number of days as an integer.")
    def recurse(node, depth):
        indent = "  " * depth
        if tree_.feature[node] != _tree.TREE_UNDEFINED:
            name = feature_name[node]
            threshold = tree_.threshold[node]

            if name == disease_input:
                val = 1
            else:
                val = 0
            if  val <= threshold:
                recurse(tree_.children_left[node], depth + 1)
            else:
                symptoms_present.append(name)
                recurse(tree_.children_right[node], depth + 1)
        else:
            present_disease = print_disease(tree_.value[node])
            # Safely check if disease exists in reduced_data
            if not present_disease or present_disease[0] not in reduced_data.index:
                print(f"Disease '{present_disease}' not found in data. Continuing...")
                return
            
            # print( "You may have " +  present_disease )
            red_cols = reduced_data.columns 
            symptoms_given = red_cols[reduced_data.loc[present_disease].values[0].nonzero()]
            # dis_list=list(symptoms_present)
            # if len(dis_list)!=0:
            #     print("symptoms present  " + str(list(symptoms_present)))
            # print("symptoms given "  +  str(list(symptoms_given)) )
            print("Are you experiencing any ")
            symptoms_exp=[]
            for syms in list(symptoms_given):
                pretty_sym = syms.replace('_', ' ')
                inp = get_user_input(f"Are you experiencing {pretty_sym}? (yes/no)")
                while inp not in ("yes", "no"):
                    inp = get_user_input("Please answer 'yes' or 'no': ")
                if(inp=="yes"):
                    symptoms_exp.append(syms)

            second_prediction=sec_predict(symptoms_exp)
            # print(second_prediction)
            calc_condition(symptoms_exp,num_days)
            if(present_disease[0]==second_prediction[0]):
                print("You may have ", present_disease[0])
                print(description_list[present_disease[0]])
                # send final result to frontend
                try:
                    msg = (
                        f"Based on your answers, you may have {present_disease[0]}. "
                        f"{description_list[present_disease[0]]}"
                    )
                    send_notification_remote(msg)
                except Exception:
                    pass

                # readn(f"You may have {present_disease[0]}")
                # readn(f"{description_list[present_disease[0]]}")

            else:
                print("You may have ", present_disease[0], "or ", second_prediction[0])
                print(description_list[present_disease[0]])
                print(description_list[second_prediction[0]])
                # send final result to frontend
                try:
                    msg = (
                        f"Based on your answers, you may have {present_disease[0]} or {second_prediction[0]}. "
                        f"{description_list[present_disease[0]]} \n {description_list[second_prediction[0]]}"
                    )
                    send_notification_remote(msg)
                except Exception:
                    pass

            # print(description_list[present_disease[0]])
            precution_list=precautionDictionary[present_disease[0]]
            print("Take following measures : ")
            measures_text = []
            for  i,j in enumerate(precution_list):
                print(i+1,")",j)
                measures_text.append(f"{i+1}) {j}")
            # also send measures to frontend as a notification
            try:
                mtext = "Recommendations:\n" + "\n".join(measures_text)
                send_notification_remote(mtext)
            except Exception:
                pass

            # confidence_level = (1.0*len(symptoms_present))/len(symptoms_given)
            # print("confidence level is " + str(confidence_level))

    recurse(0, 1)
getSeverityDict()
getDescription()
getprecautionDict()
getInfo()
while True:
    tree_to_code(clf,cols)
    print("----------------------------------------------------------------------------------------")

