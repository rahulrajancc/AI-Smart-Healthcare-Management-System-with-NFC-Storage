import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

export default function Signup({ onSignupSuccess }) {

  let ur = "10.249.2.231";

  const navigation = useNavigation();

  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");
  const [agreeTerms,setAgreeTerms] = useState(false);
  const [loading,setLoading] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(80)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(()=>{

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
    ]).start();

  },[])

  const pressIn = ()=>{
    Animated.spring(scale,{
      toValue:0.96,
      useNativeDriver:true
    }).start();
  }

  const pressOut = ()=>{
    Animated.spring(scale,{
      toValue:1,
      useNativeDriver:true
    }).start();
  }

  const validateEmail = (text) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)

  const handleSignup = async () => {

    if(!name || !phone || !email || !password){
      return Alert.alert("Validation","Please fill all fields")
    }

    if(phone.length < 10){
      return Alert.alert("Validation","Enter valid phone number")
    }

    if(!validateEmail(email)){
      return Alert.alert("Validation","Invalid email address")
    }

    if(password.length < 6){
      return Alert.alert("Validation","Password must be 6 characters")
    }

    if(password !== confirmPassword){
      return Alert.alert("Validation","Passwords do not match")
    }

    if(!agreeTerms){
      return Alert.alert("Validation","Please accept terms")
    }

    setLoading(true)

    try{

      const response = await fetch("http://"+ur+":2000/signin",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          name,
          phone,
          email,
          pass:password
        })
      })

      const data = await response.json()

      setLoading(false)

      if(response.ok || data.insertedId){
        Alert.alert("Success","Account created! Please login")
        onSignupSuccess()
      }else{
        Alert.alert("Error",data.message || "Signup failed")
      }

    }catch(e){
      setLoading(false)
      Alert.alert("Error","Network error")
    }

  }

  const toggleTerms = ()=>{
    setAgreeTerms(!agreeTerms)
  }

  return (

  <SafeAreaView style={{flex:1}}>

  <LinearGradient
  colors={["#0f2027","#203a43","#2c5364"]}
  style={{flex:1}}
  >

  <KeyboardAvoidingView
  behavior={Platform.OS==="ios"?"padding":"height"}
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

  <Text style={styles.logo}>🏥</Text>

  <Text style={styles.title}>Create Account</Text>

  <Text style={styles.subtitle}>
  Join MedAI Health Card
  </Text>

  <TextInput
  style={styles.input}
  placeholder="Full Name"
  placeholderTextColor="#888"
  value={name}
  onChangeText={setName}
  />

  <TextInput
  style={styles.input}
  placeholder="Phone Number"
  placeholderTextColor="#888"
  keyboardType="phone-pad"
  value={phone}
  onChangeText={setPhone}
  maxLength={10}
  />

  <TextInput
  style={styles.input}
  placeholder="Email Address"
  placeholderTextColor="#888"
  keyboardType="email-address"
  value={email}
  onChangeText={setEmail}
  />

  <TextInput
  style={styles.input}
  placeholder="Password"
  placeholderTextColor="#888"
  secureTextEntry
  value={password}
  onChangeText={setPassword}
  />

  <TextInput
  style={styles.input}
  placeholder="Confirm Password"
  placeholderTextColor="#888"
  secureTextEntry
  value={confirmPassword}
  onChangeText={setConfirmPassword}
  />

  <TouchableOpacity
  style={styles.termsRow}
  onPress={toggleTerms}
  >

  <View style={[
    styles.checkbox,
    agreeTerms && styles.checkboxActive
  ]}>
  {agreeTerms && <Text style={{color:"#fff"}}>✓</Text>}
  </View>

  <Text style={styles.termsText}>
  I agree to Terms of Service & Privacy Policy
  </Text>

  </TouchableOpacity>

  <Animated.View style={{transform:[{scale}]}}>

  <TouchableOpacity
  style={styles.signupButton}
  onPress={handleSignup}
  onPressIn={pressIn}
  onPressOut={pressOut}
  >

  <Text style={styles.signupText}>
  {loading ? "Creating..." : "Create Account"}
  </Text>

  </TouchableOpacity>

  </Animated.View>

  <TouchableOpacity
  onPress={()=>navigation.navigate("LoginScreen")}
  >

  <Text style={styles.login}>
  Already have an account? Sign In
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
marginBottom:25
},

input:{
backgroundColor:"#f5f7fb",
padding:14,
borderRadius:12,
fontSize:15,
marginBottom:14
},

termsRow:{
flexDirection:"row",
alignItems:"center",
marginVertical:10
},

checkbox:{
width:22,
height:22,
borderWidth:1,
borderColor:"#bbb",
borderRadius:6,
marginRight:10,
justifyContent:"center",
alignItems:"center"
},

checkboxActive:{
backgroundColor:"#2c7be5",
borderColor:"#2c7be5"
},

termsText:{
flex:1,
fontSize:13,
color:"#555"
},

signupButton:{
backgroundColor:"#2c7be5",
padding:16,
borderRadius:14,
alignItems:"center",
marginTop:10
},

signupText:{
color:"#fff",
fontWeight:"700",
fontSize:16
},

login:{
textAlign:"center",
marginTop:20,
color:"#2c7be5",
fontWeight:"600"
}

})