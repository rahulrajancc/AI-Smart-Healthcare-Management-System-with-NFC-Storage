import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../../App";

let AsyncStorage;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (e) {
  AsyncStorage = null;
}

const STORAGE_KEY = "recripts_v1";

let ur = "10.249.2.231";
const BASE = "http://" + ur + ":2000";

export default function Recript() {
  const [items, setItems] = useState([]);
  const [useServer, setUseServer] = useState(true);
  const { user } = useContext(UserContext);
  const patientPhone = user?.phone || "";
  const patientCard = user?.nfcCardId || "";

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (useServer && user && (user.phone || user.nfcCardId)) {
      load();
    }
  }, [user, useServer]);

  const load = async () => {
    if (useServer && (patientPhone || patientCard)) {
      try {
        let phone = patientPhone;

        if (!phone && patientCard) {
          const r = await fetch(`${BASE}/api/user/by-card/${patientCard}/timeline`);
          const timeline = await r.json();

          setItems(
            timeline.map((e, idx) => ({
              id: idx.toString(),
              title: e.name,
              notes: e.dose,
            }))
          );
          return;
        }

        const res = await fetch(`${BASE}/api/user/${phone}/timeline`);
        const timeline = await res.json();

        setItems(
          timeline.map((e, idx) => ({
            id: idx.toString(),
            title: e.name,
            notes: e.dose,
          }))
        );
      } catch {
        setItems([]);
      }

      return;
    }

    if (!AsyncStorage) {
      setItems([]);
      return;
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setItems(JSON.parse(raw));
  };

  const save = async (newItems) => {
    setItems(newItems);
    if (!AsyncStorage) return;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const addItem = async () => {
    if (!title.trim()) return Alert.alert("Validation", "Enter prescription title");

    const newItem = {
      id: Date.now().toString(),
      title: title.trim(),
      notes: notes.trim(),
    };

    const newItems = [newItem, ...items];
    save(newItems);

    setTitle("");
    setNotes("");
    setModalVisible(false);
  };

  const deleteItem = (id) => {
    Alert.alert("Delete", "Delete prescription?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const newItems = items.filter((i) => i.id !== id);
          save(newItems);
        },
      },
    ]);
  };

  const sendItem = async (item) => {
    try {
      setSendingId(item.id);

      const payload = `#${patientCard}#${item.title};${item.notes}`;

      await fetch(`${BASE}/write`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: payload }),
      });

      Alert.alert("Success", "Written to NFC card");
    } catch {
      Alert.alert("Error", "Failed to write NFC");
    } finally {
      setSendingId(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name="medkit" size={22} color="#2563eb" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.notes}>{item.notes}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => sendItem(item)}
        >
          {sendingId === item.id ? (
            <ActivityIndicator color="#fff" size={14} />
          ) : (
            <Ionicons name="send" size={16} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteItem(item.id)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💊 Prescriptions</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Server</Text>
            <Switch value={useServer} onValueChange={setUseServer} />
          </View>
        </View>

        {/* LIST */}
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={40} color="#94a3b8" />
              <Text style={styles.empty}>No prescriptions yet</Text>
            </View>
          }
        />

        {/* FLOAT BUTTON */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>

        {/* MODAL */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalWrap}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>New Prescription</Text>

              <TextInput
                placeholder="Prescription title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />

              <TextInput
                placeholder="Medicines / notes"
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, { height: 90 }]}
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancel}
                  onPress={() => setModalVisible(false)}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                  <Text style={{ color: "#fff" }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

safe:{
flex:1,
backgroundColor:"#f1f5f9"
},

container:{
flex:1,
padding:16
},

header:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
marginBottom:10
},

headerTitle:{
fontSize:24,
fontWeight:"700"
},

switchRow:{
flexDirection:"row",
alignItems:"center"
},

switchText:{
marginRight:6
},

card:{
flexDirection:"row",
backgroundColor:"#fff",
padding:14,
borderRadius:16,
marginBottom:12,
alignItems:"center",
shadowColor:"#000",
shadowOpacity:0.05,
shadowRadius:8,
elevation:3
},

iconBox:{
width:40,
height:40,
borderRadius:12,
backgroundColor:"#e0edff",
justifyContent:"center",
alignItems:"center",
marginRight:10
},

title:{
fontWeight:"700",
fontSize:16
},

notes:{
color:"#64748b",
fontSize:13
},

actions:{
flexDirection:"row"
},

sendBtn:{
backgroundColor:"#2563eb",
padding:8,
borderRadius:8,
marginRight:6
},

deleteBtn:{
backgroundColor:"#ef4444",
padding:8,
borderRadius:8
},

emptyBox:{
alignItems:"center",
marginTop:60
},

empty:{
marginTop:10,
color:"#94a3b8"
},

fab:{
position:"absolute",
right:20,
bottom:30,
backgroundColor:"#2563eb",
width:60,
height:60,
borderRadius:30,
justifyContent:"center",
alignItems:"center",
elevation:6
},

modalWrap:{
flex:1,
backgroundColor:"rgba(0,0,0,0.4)",
justifyContent:"center",
padding:20
},

modal:{
backgroundColor:"#fff",
borderRadius:20,
padding:20
},

modalTitle:{
fontSize:20,
fontWeight:"700",
marginBottom:14
},

input:{
borderWidth:1,
borderColor:"#e2e8f0",
backgroundColor:"#f8fafc",
padding:12,
borderRadius:12,
marginBottom:10
},

modalButtons:{
flexDirection:"row",
justifyContent:"flex-end"
},

cancel:{
marginRight:10,
padding:10
},

addBtn:{
backgroundColor:"#2563eb",
padding:10,
borderRadius:8
}

})