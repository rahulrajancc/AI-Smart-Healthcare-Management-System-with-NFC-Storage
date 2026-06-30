import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { UserContext } from "../../App";

export default function Home() {

  const { user } = useContext(UserContext);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  useEffect(()=>{
    Animated.parallel([
      Animated.timing(fade,{
        toValue:1,
        duration:800,
        useNativeDriver:true
      }),
      Animated.spring(slide,{
        toValue:0,
        useNativeDriver:true
      })
    ]).start()
  },[])

  const [bloodType,setBloodType] = useState("O+")
  const [lastSync,setLastSync] = useState("")
  const [cardId,setCardId] = useState("")
  const [prescriptionCount,setPrescriptionCount] = useState(0)
  const [reportCount,setReportCount] = useState(0)
  const [checkupCount,setCheckupCount] = useState(0)
  const [vaccinesCount,setVaccinesCount] = useState(0)

  const [timelineData,setTimelineData] = useState([])
  const [modalVisible,setModalVisible] = useState(false)
  const [modalTitle,setModalTitle] = useState("")
  const [modalItems,setModalItems] = useState([])

  let ur="10.249.2.231"
  const BASE = "http://"+ur+":2000"

  const loadData = async ()=>{

    if(!user) return

    try{

      let profileRes = await fetch(`${BASE}/api/user/${user.phone}`)
      let timelineRes = await fetch(`${BASE}/api/user/${user.phone}/timeline`)

      if(profileRes.ok){
        const u = await profileRes.json()

        setBloodType(u.bloodType || "")
        setCardId(u.nfcCardId || "")

        if(u.lastSync){
          setLastSync(new Date(u.lastSync).toLocaleString())
        }

        setPrescriptionCount(u.prescriptionCount || 0)
        setReportCount(u.reportCount || 0)
        setCheckupCount(u.checkupCount || 0)
        setVaccinesCount(u.vaccinesCount || 0)
      }

      if(timelineRes.ok){

        const t = await timelineRes.json()

        setTimelineData(
          t.map((entry,idx)=>{

            let type = entry.type || "prescription"

            let icon="💊"

            if(type==="report") icon="🧾"
            if(type==="checkup") icon="🩺"
            if(type==="vaccine") icon="💉"

            return {
              id:idx.toString(),
              date:entry.date,
              title:entry.name,
              description:entry.details || entry.dose || "",
              doctor:entry.doctor,
              icon
            }

          })
        )

      }

    }catch(e){
      console.log(e)
    }

  }

  useEffect(()=>{
    loadData()
  },[user])

  const refreshData = ()=> loadData()

  const showRecent=(type)=>{

    const items = timelineData.filter(e=>e.icon)

    setModalTitle(type)
    setModalItems(items.slice(-10).reverse())
    setModalVisible(true)

  }

  const StatCard=({label,value,icon})=>(

    <Animated.View
      style={{
        flex:1,
        opacity:fade,
        transform:[{translateY:slide}]
      }}
    >

    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>

    </Animated.View>
  )

  return (

  <SafeAreaView style={styles.safe}>

  <ScrollView showsVerticalScrollIndicator={false}>

  {/* HEADER */}

  <LinearGradient
  colors={["#0f2027","#203a43","#2c5364"]}
  style={styles.header}
  >

  <Text style={styles.greeting}>Welcome Back</Text>

  <Text style={styles.name}>
  {user?.name || ""}
  </Text>

  </LinearGradient>

  {/* HEALTH CARD */}

  <Animated.View
  style={[
    styles.healthCard,
    {opacity:fade,transform:[{translateY:slide}]}
  ]}
  >

  <View style={styles.healthRow}>
    <View>
      <Text style={styles.cardLabel}>Blood Type</Text>
      <Text style={styles.cardValue}>{bloodType}</Text>
    </View>

    <View>
      <Text style={styles.cardLabel}>NFC Card</Text>
      <Text style={styles.cardValue}>{cardId}</Text>
    </View>

    <View>
      <Text style={styles.cardLabel}>Last Sync</Text>
      <Text style={styles.cardValue}>{lastSync}</Text>
    </View>
  </View>

  <TouchableOpacity
  style={styles.refreshBtn}
  onPress={refreshData}
  >
  <Text style={{color:"#fff"}}>Refresh</Text>
  </TouchableOpacity>

  </Animated.View>

  {/* STATS */}

  <Text style={styles.sectionTitle}>Health Stats</Text>

  <View style={styles.statsGrid}>

  <TouchableOpacity onPress={()=>showRecent("Prescriptions")}>
  <StatCard label="Prescriptions" value={prescriptionCount} icon="💊"/>
  </TouchableOpacity>

  <TouchableOpacity onPress={()=>showRecent("Reports")}>
  <StatCard label="Reports" value={reportCount} icon="🧾"/>
  </TouchableOpacity>

  <TouchableOpacity onPress={()=>showRecent("Checkups")}>
  <StatCard label="Checkups" value={checkupCount} icon="🩺"/>
  </TouchableOpacity>

  <TouchableOpacity onPress={()=>showRecent("Vaccines")}>
  <StatCard label="Vaccines" value={vaccinesCount} icon="💉"/>
  </TouchableOpacity>

  </View>

  {/* TIMELINE */}

  <Text style={styles.sectionTitle}>Health Timeline</Text>

  <View style={styles.timeline}>

  {timelineData.map((event)=>(
    <View key={event.id} style={styles.timelineCard}>

      <Text style={styles.timelineIcon}>{event.icon}</Text>

      <View style={{flex:1}}>

        <Text style={styles.timelineTitle}>
        {event.title}
        </Text>

        <Text style={styles.timelineDate}>
        {event.date}
        </Text>

        <Text style={styles.timelineDesc}>
        {event.description}
        </Text>

        <Text style={styles.timelineDoctor}>
        {event.doctor}
        </Text>

      </View>

    </View>
  ))}

  </View>

  {/* MODAL */}

  <Modal visible={modalVisible} transparent animationType="fade">

  <View style={styles.modalOverlay}>

  <View style={styles.modalContent}>

  <Text style={styles.modalTitle}>
  {modalTitle}
  </Text>

  <ScrollView>

  {modalItems.map((it,i)=>(
    <View key={i} style={styles.modalItem}>

      <Text style={styles.modalDate}>{it.date}</Text>
      <Text style={styles.modalText}>{it.title}</Text>

    </View>
  ))}

  </ScrollView>

  <TouchableOpacity
  onPress={()=>setModalVisible(false)}
  style={styles.closeBtn}
  >

  <Text style={{color:"#fff"}}>Close</Text>

  </TouchableOpacity>

  </View>

  </View>

  </Modal>

  </ScrollView>

  </SafeAreaView>
  )
}

const styles = StyleSheet.create({

safe:{flex:1,backgroundColor:"#f4f6fa"},

header:{
padding:25,
borderBottomLeftRadius:25,
borderBottomRightRadius:25
},

greeting:{
color:"#ccc",
fontSize:14
},

name:{
color:"#fff",
fontSize:28,
fontWeight:"700",
marginTop:5
},

healthCard:{
backgroundColor:"#fff",
margin:15,
padding:18,
borderRadius:16,
shadowColor:"#000",
shadowOpacity:0.15,
shadowRadius:15,
elevation:6
},

healthRow:{
flexDirection:"row",
justifyContent:"space-between"
},

cardLabel:{
fontSize:12,
color:"#888"
},

cardValue:{
fontSize:16,
fontWeight:"700"
},

refreshBtn:{
backgroundColor:"#2c7be5",
padding:8,
borderRadius:8,
marginTop:12,
alignSelf:"flex-end"
},

sectionTitle:{
fontSize:18,
fontWeight:"700",
marginHorizontal:15,
marginTop:10,
marginBottom:10
},

statsGrid:{
flexDirection:"row",
justifyContent:"space-between",
paddingHorizontal:10
},

statCard:{
backgroundColor:"#fff",
borderRadius:14,
padding:14,
alignItems:"center",
margin:4,
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:10,
elevation:4
},

statIcon:{
fontSize:28
},

statValue:{
fontSize:18,
fontWeight:"700"
},

statLabel:{
fontSize:11,
color:"#666"
},

timeline:{
padding:12
},

timelineCard:{
flexDirection:"row",
backgroundColor:"#fff",
borderRadius:14,
padding:14,
marginBottom:10,
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:10,
elevation:3
},

timelineIcon:{
fontSize:24,
marginRight:10
},

timelineTitle:{
fontSize:15,
fontWeight:"700"
},

timelineDate:{
fontSize:11,
color:"#888"
},

timelineDesc:{
fontSize:13,
color:"#555",
marginTop:3
},

timelineDoctor:{
fontSize:12,
color:"#2c7be5",
marginTop:4
},

modalOverlay:{
flex:1,
backgroundColor:"rgba(0,0,0,0.4)",
justifyContent:"center",
alignItems:"center"
},

modalContent:{
backgroundColor:"#fff",
width:"85%",
borderRadius:18,
padding:18
},

modalTitle:{
fontSize:18,
fontWeight:"700",
marginBottom:10,
textAlign:"center"
},

modalItem:{
borderBottomWidth:1,
borderColor:"#eee",
paddingVertical:8
},

modalDate:{
fontSize:11,
color:"#888"
},

modalText:{
fontSize:14,
fontWeight:"600"
},

closeBtn:{
backgroundColor:"#2c7be5",
marginTop:12,
padding:10,
borderRadius:10,
alignItems:"center"
}

})