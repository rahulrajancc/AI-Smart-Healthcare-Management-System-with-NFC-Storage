import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [bloodType, setBloodType] = useState('')
  const [cardId, setCardId] = useState('not set')
  const [lastSync, setLastSync] = useState('2 hours ago')
  const [prescriptionCount, setPrescriptionCount] = useState(0)
  const [reportCount, setReportCount] = useState(0)
  const [checkupCount, setCheckupCount] = useState(0)
  const [vaccinesCount, setVaccinesCount] = useState(0)
  const [healthTimeline, setHealthTimeline] = useState([])
  const [timelineModal, setTimelineModal] = useState(false)
  const [tlDate, setTlDate] = useState('')
  const [tlName, setTlName] = useState('')
  const [tlDose, setTlDose] = useState('')
  const [tlDoctor, setTlDoctor] = useState('')
  const [emergencyModal, setEmergencyModal] = useState(false)
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: '1', name: 'Shoan kundan', phone: '911' },
  ])
  const[phone, setPhone] = useState('')
  const[email, setEmail] = useState('')
  const navigation = useNavigation()

  const theme = darkMode ? { bg: '#1a1a1a', text: '#fff', card: '#2a2a2a', border: '#444' } : { bg: '#f7f8fb', text: '#000', card: '#fff', border: '#eee' }

  const addEmergencyContact = () => {
    if (!emergencyName.trim() || !emergencyPhone.trim()) return Alert.alert('Validation', 'Please fill all fields')
    const newContact = { id: Date.now().toString(), name: emergencyName, phone: emergencyPhone }
    setEmergencyContacts([...emergencyContacts, newContact])
    setEmergencyName('')
    setEmergencyPhone('')
    setEmergencyModal(false)
  }

  const deleteEmergencyContact = (id) => {
    Alert.alert('Delete', 'Remove this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setEmergencyContacts(emergencyContacts.filter((c) => c.id !== id)),
      },
    ])
  }

  const exportData = () => {
    Alert.alert('Export Data', 'Your health records will be exported as JSON. This includes prescriptions, health history, and medical data.\n\nFile: health_records_backup.json', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Export', onPress: () => Alert.alert('Success', 'Data exported successfully!') },
    ])
  }

  const syncNFCCard = () => {
    Alert.alert('NFC Sync', 'Hold your NFC card near your device to sync health data...', [{ text: 'OK', style: 'cancel' }])
    // example update when syncing
    const now = new Date()
    setLastSync(now.toLocaleString())
  }

  // network helpers for profile storage
  const USER_PHONE = '911' // TODO: replace with authenticated user identifier
  const BASE = 'http://10.249.2.231:2000'

  const loadProfile = async () => {
    try {
      const res = await fetch(`${BASE}/api/user/${USER_PHONE}`)
      if (res.ok) {
        const u = await res.json()
        setBloodType(u.bloodType || 'O+')
        setCardId(u.nfcCardId || "not set")
        if (u.lastSync) setLastSync(new Date(u.lastSync).toLocaleString())
        setPrescriptionCount(u.prescriptionCount || 0)
        setReportCount(u.reportCount || 0)
        setCheckupCount(u.checkupCount || 0)
        setVaccinesCount(u.vaccinesCount || 0)
        setHealthTimeline(u.healthTimeline || [])
        setEmail(u.email || '')
        setPhone(u.phone || phone)
      }
    } catch (e) {
      console.warn('load profile failed', e)
    }
  }

  const saveProfile = async () => {
    try {
      await fetch(`${BASE}/api/user/${USER_PHONE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodType,
          nfcCardId: cardId,
          lastSync: lastSync ? new Date(lastSync) : undefined,
          prescriptionCount,
          reportCount,
          checkupCount,
          vaccinesCount,
        }),
      })
    } catch (e) {
      console.warn('save profile failed', e)
    }
  }

  React.useEffect(() => {
    loadProfile()
  }, [])

  React.useEffect(() => {
    saveProfile()
  }, [bloodType, cardId, lastSync, prescriptionCount, reportCount, checkupCount, vaccinesCount])

  const SettingSection = ({ title, children }) => (
    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  )

  const SettingItem = ({ label, value, onPress, rightElement }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {rightElement || <Text style={styles.value}>{value}</Text>}
    </TouchableOpacity>
  )

  const EmergencyContactCard = ({ contact }) => (
    <View style={[styles.contactCard, { borderColor: theme.border }]}>
      <View>
        <Text style={[styles.contactName, { color: theme.text }]}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteEmergencyContact(contact.id)}>
        <Text style={styles.deleteBtnText}>×</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: theme.text }]}>⚙️ Settings</Text>

        {/* Display & Appearance */}
        <SettingSection title="Display & Appearance">
          <SettingItem
            label="Dark Mode"
            rightElement={<Switch value={darkMode} onValueChange={setDarkMode} />}
          />
        </SettingSection>

        {/* Health Profile */}
        <SettingSection title="Health Profile">
          <SettingItem label="Blood Type" value={bloodType} onPress={() => Alert.alert('Blood Type', 'Select your blood type', [
            { text: 'O+', onPress: () => setBloodType('O+') },
            { text: 'O-', onPress: () => setBloodType('O-') },
            { text: 'A+', onPress: () => setBloodType('A+') },
            { text: 'B+', onPress: () => setBloodType('B+') },
          ])} />
          <SettingItem label="Age" value="28 years" />
          <SettingItem label="Height" value="5'10\" />
          <SettingItem label="Weight" value="72 kg" />
          <SettingItem label="Allergies" value="Penicillin, Shellfish" />
          <SettingItem label="Prescriptions" value={`${prescriptionCount}`} />
          <SettingItem label="Reports" value={`${reportCount}`} />
          <SettingItem label="Checkups" value={`${checkupCount}`} />
          <SettingItem label="Vaccines" value={`${vaccinesCount}`} />
        </SettingSection>

        {/* NFC Card Management */}
        <SettingSection title="NFC Card & Sync">
          <TouchableOpacity style={[styles.btn, styles.nfcBtn]} onPress={syncNFCCard}>
            <Text style={styles.btnText}>📱 Sync with NFC Card</Text>
          </TouchableOpacity>
          <SettingItem label="Card ID" value={cardId} />
          <SettingItem label="Last Sync" value={lastSync} />
          <SettingItem label="Encrypted Storage" value="Enabled" />
        </SettingSection>

        {/* Health Timeline */}
        <SettingSection title="Health Timeline">
          {healthTimeline.length === 0 && (
            <Text style={[styles.value, { color: theme.text, fontStyle: 'italic' }]}>No entries</Text>
          )}
          {healthTimeline.map((e, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <Text style={[styles.timelineText, { color: theme.text }]}>
                {e.date} - {e.name} ({e.dose})
              </Text>
              <Text style={[styles.timelineSub, { color: theme.text }]}>by {e.doctor}</Text>
            </View>
          ))}
          <TouchableOpacity style={[styles.btn, styles.addBtn]} onPress={() => setTimelineModal(true)}>
            <Text style={styles.btnText}>+ Add Timeline Entry</Text>
          </TouchableOpacity>
        </SettingSection>

        {/* Emergency Contacts */}
        <SettingSection title="Emergency Contacts">
          {emergencyContacts.map((c) => (
            <EmergencyContactCard key={c.id} contact={c} />
          ))}
          <TouchableOpacity style={[styles.btn, styles.addBtn]} onPress={() => setEmergencyModal(true)}>
            <Text style={styles.btnText}>+ Add Emergency Contact</Text>
          </TouchableOpacity>
        </SettingSection>

        {/* Notifications & Reminders */}
        <SettingSection title="Notifications & Reminders">
          <SettingItem
            label="Enable Notifications"
            rightElement={<Switch value={notifications} onValueChange={setNotifications} />}
          />
          <SettingItem label="Medicine Reminders" value="Daily at 9 AM" />
          <SettingItem label="Appointment Alerts" value="24 hours before" />
        </SettingSection>

        {/* Data & Privacy */}
        <SettingSection title="Data & Privacy">
          <TouchableOpacity style={[styles.btn, styles.exportBtn]} onPress={exportData}>
            <Text style={styles.btnText}>📥 Export Health Records</Text>
          </TouchableOpacity>
          <SettingItem label="Data Encryption" value="AES-256" />
          <SettingItem label="Privacy Mode" value="Enabled" />
          <SettingItem label="Recovery Code" value="Show" onPress={() => Alert.alert('Recovery Code', 'Your 12-word recovery code:\n\nhealth patient card secure data backup recovery phone')} />
        </SettingSection>

        {/* Account & Session */}
        <SettingSection title="Account & Session">
          <SettingItem label="Phone Number" value={phone} />
          <SettingItem label="Email" value={email} />
          <TouchableOpacity style={[styles.btn, styles.logoutBtn]} onPress={() => Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive' },
          ])}>
            <Text style={[styles.btnText, { color: '#ff3b30' }]} > Logout</Text>
          </TouchableOpacity>
        </SettingSection>

        {/* About App */}
        <SettingSection title="About">
          <SettingItem label="App Version" value="1.0.0" />
          <SettingItem label="Build" value="#20241207" />
          <Text style={[styles.about, { color: theme.text }]}>
            Smart NFC Health Card — Your health, secured offline. Manage prescriptions, health history, and sync with NFC cards seamlessly.
            
          </Text>
        </SettingSection>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Emergency Contact Modal */}
      <Modal visible={emergencyModal} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Emergency Contact</Text>
            <TextInput
              placeholder="Name"
              value={emergencyName}
              onChangeText={setEmergencyName}
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              placeholderTextColor={theme.text === '#fff' ? '#aaa' : '#ccc'}
            />
            <TextInput
              placeholder="Phone Number"
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              keyboardType="phone-pad"
              placeholderTextColor={theme.text === '#fff' ? '#aaa' : '#ccc'}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEmergencyModal(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#0a84ff' }]} onPress={addEmergencyContact}>
                <Text style={[styles.btnText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Timeline Entry Modal */}
      <Modal visible={timelineModal} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Timeline Entry</Text>
            <TextInput
              placeholder="Date (e.g. 2025-12-01)"
              value={tlDate}
              onChangeText={setTlDate}
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              placeholderTextColor={theme.text === '#fff' ? '#aaa' : '#ccc'}
            />
            <TextInput
              placeholder="Name (medication/test)"
              value={tlName}
              onChangeText={setTlName}
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              placeholderTextColor={theme.text === '#fff' ? '#aaa' : '#ccc'}
            />
            <TextInput
              placeholder="Dose"
              value={tlDose}
              onChangeText={setTlDose}
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              placeholderTextColor={theme.text === '#fff' ? '#aaa' : '#ccc'}
            />
            <TextInput
              placeholder="Doctor name"
              value={tlDoctor}
              onChangeText={setTlDoctor}
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              placeholderTextColor={theme.text === '#fff' ? '#aaa' : '#ccc'}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setTimelineModal(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#0a84ff' }]}
                onPress={async () => {
                  if (!tlDate || !tlName) return Alert.alert('Validation', 'Please fill date and name')
                  const entry = { date: tlDate, name: tlName, dose: tlDose, doctor: tlDoctor }
                  setHealthTimeline([...healthTimeline, entry])
                  // post to server
                  try {
                    await fetch(`${BASE}/api/user/${USER_PHONE}/timeline`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(entry),
                    })
                  } catch (e) { console.warn('timeline post failed', e) }
                  setTlDate(''); setTlName(''); setTlDose(''); setTlDoctor('')
                  setTimelineModal(false)
                }}
              >
                <Text style={[styles.btnText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, padding: 12 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 14, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  sectionTitle: { fontSize: 14, fontWeight: '600', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 },
  item: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#e6e9ef', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14 },
  value: { color: '#666', fontSize: 12 },
  btn: { margin: 10, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  nfcBtn: { backgroundColor: '#34c759', marginTop: 8 },
  addBtn: { backgroundColor: '#0a84ff' },
  exportBtn: { backgroundColor: '#5856d6' },
  logoutBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ff3b30' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  contactCard: { margin: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8, borderWidth: 1, backgroundColor: 'rgba(10, 132, 255, 0.05)' },
  contactName: { fontSize: 14, fontWeight: '600' },
  contactPhone: { fontSize: 12, color: '#666', marginTop: 2 },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ff3b30', justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontSize: 24 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 14 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  about: { padding: 12, fontSize: 12, lineHeight: 18 },
  spacer: { height: 20 },
})