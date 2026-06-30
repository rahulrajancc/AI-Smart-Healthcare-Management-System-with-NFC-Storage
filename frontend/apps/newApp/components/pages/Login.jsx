import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

export default function Login({ onLoginSuccess }) {

  const navigation = useNavigation()

  let ur = "10.249.2.231"

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const fade = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(80)).current
  const scale = useRef(new Animated.Value(1)).current

  useEffect(() => {

    Animated.parallel([
      Animated.timing(fade,{
        toValue:1,
        duration:900,
        useNativeDriver:true
      }),

      Animated.spring(slide,{
        toValue:0,
        useNativeDriver:true
      })

    ]).start()

  },[])

  const pressIn = () => {
    Animated.spring(scale,{
      toValue:0.96,
      useNativeDriver:true
    }).start()
  }

  const pressOut = () => {
    Animated.spring(scale,{
      toValue:1,
      useNativeDriver:true
    }).start()
  }

  const handleLogin = async () => {

    if(!phone.trim() || !password.trim()){
      return Alert.alert("Validation","Please fill all fields")
    }

    setLoading(true)

    try{

      const response = await fetch("http://"+ur+":2000/login",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          phone:phone,
          pass:password
        })
      })

      const data = await response.json()

      setLoading(false)

      if(data.success || data.message === "Login successful"){
        Alert.alert("Success",data.message)
        onLoginSuccess({phone,name:data.name})
        // navigation.navigate("Home");
      }else{
        Alert.alert("Error",data.message || "Invalid credentials")
      }

    }catch(e){

      setLoading(false)
      Alert.alert("Error","Network error")

    }

  }

  const loginWithCard = async () => {

    const card = prompt("Enter NFC card ID")

    if(!card) return

    try{

      const res = await fetch("http://"+ur+":2000/api/user/by-card/"+card)

      if(res.ok){
        const u = await res.json()
        onLoginSuccess({phone:u.phone})
      }else{
        Alert.alert("Card not recognized")
      }

    }catch{
      Alert.alert("Network error")
    }

  }

  return (

    <SafeAreaView style={{flex:1}}>

      <LinearGradient
        colors={["#0f2027","#203a43","#2c5364"]}
        style={{flex:1}}
      >

        <KeyboardAvoidingView
          behavior={Platform.OS==="ios"?"padding":null}
          style={{flex:1}}
        >

        <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:"center"}}>

        <Animated.View
        style={[
          styles.container,
          {
            opacity:fade,
            transform:[{translateY:slide}]
          }
        ]}
        >

        <Animated.Text
        style={[
          styles.logo,
          {
            transform:[{scale:scale}]
          }
        ]}
        >
        🏥
        </Animated.Text>

        <Text style={styles.title}>
        MedAI Health Card
        </Text>

        <Text style={styles.subtitle}>
        Secure access to your digital health records
        </Text>

        <View style={styles.inputBox}>

        <Text style={styles.label}>Phone Number</Text>

        <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        placeholderTextColor="#888"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={10}
        />

        </View>

        <View style={styles.inputBox}>

        <Text style={styles.label}>Password</Text>

        <TextInput
        style={styles.input}
        placeholder="Enter password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        />

        </View>

        <Animated.View
        style={{
          transform:[{scale}]
        }}
        >

        <TouchableOpacity
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.loginButton}
        onPress={handleLogin}
        >

        <Text style={styles.loginText}>
        {loading ? "Signing in..." : "Sign In"}
        </Text>

        </TouchableOpacity>

        </Animated.View>

        <Text style={styles.or}>or continue with</Text>

        <TouchableOpacity
        style={styles.nfcButton}
        onPress={loginWithCard}
        >

        <Text style={styles.nfcText}>
        📱 Login using NFC Health Card
        </Text>

        </TouchableOpacity>

        <TouchableOpacity
        onPress={()=>navigation.navigate("SignupScreen")}
        >

        <Text style={styles.signup}>
        Don't have an account? Sign Up
        </Text>

        </TouchableOpacity>

        </Animated.View>

        </ScrollView>

        </KeyboardAvoidingView>

      </LinearGradient>

    </SafeAreaView>

  )
}

const styles = StyleSheet.create({

container:{
backgroundColor:"rgba(255,255,255,0.95)",
margin:20,
padding:28,
borderRadius:24,
shadowColor:"#000",
shadowOpacity:0.25,
shadowRadius:25,
elevation:15
},

logo:{
fontSize:60,
textAlign:"center",
marginBottom:10
},

title:{
fontSize:26,
fontWeight:"700",
textAlign:"center"
},

subtitle:{
textAlign:"center",
color:"#666",
marginBottom:30
},

inputBox:{
marginBottom:18
},

label:{
fontWeight:"600",
marginBottom:6
},

input:{
backgroundColor:"#f5f7fb",
padding:14,
borderRadius:12,
fontSize:15
},

loginButton:{
backgroundColor:"#2c7be5",
padding:16,
borderRadius:14,
alignItems:"center",
marginTop:5
},

loginText:{
color:"#fff",
fontWeight:"700",
fontSize:16
},

or:{
textAlign:"center",
marginVertical:20,
color:"#777"
},

nfcButton:{
borderWidth:1,
borderColor:"#2c7be5",
padding:15,
borderRadius:14,
alignItems:"center"
},

nfcText:{
color:"#2c7be5",
fontWeight:"600"
},

signup:{
textAlign:"center",
marginTop:22,
color:"#2c7be5",
fontWeight:"600"
}

})