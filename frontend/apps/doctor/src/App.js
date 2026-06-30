import React, { useState, useEffect } from 'react';
import './App.css';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// simple helper to format date
function todayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function App() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', email: '' });
  const [rxForm, setRxForm] = useState({ date: todayString(), name: '', dose: '', doctor: '' });
  const [doctor, setDoctor] = useState(null);
  const [reportForm, setReportForm] = useState({ date: todayString(), title: '', details: '', type: '' });
  const [checkupForm, setCheckupForm] = useState({ date: todayString(), findings: '', notes: '', doctor: '' });
  const [vaccineForm, setVaccineForm] = useState({ date: todayString(), name: '', batch: '', notes: '' });
const downloadPrescription = async () => {
  const element = document.getElementById("prescription-card");

  if (!element) return;

  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF();
  pdf.addImage(imgData, "PNG", 10, 10, 180, 0);
  pdf.save("prescription.pdf");
};
  const [loginForm, setLoginForm] = useState({ phone: '', pass: '' });
  // ensure name property exists
  useEffect(() => {
    if (loginForm.name === undefined) setLoginForm((f) => ({ ...f, name: '' }));
  }, [loginForm.name]);
  // include name for signup
  useEffect(() => {
    if (loginForm.name === undefined) setLoginForm((f) => ({ ...f, name: '' }));
  }, [loginForm.name]);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCard, setSearchCard] = useState('');
  const [sending, setSending] = useState({});

  // NFC Scanning state
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [parsedHealthData, setParsedHealthData] = useState(null);
  const [currentView, setCurrentView] = useState('patient'); // 'patient' or 'nfc'

  // Popup state
  const [popup, setPopup] = useState({ show: false, message: '', type: 'info' });

  const BASE = 'http://10.249.2.231:2000';

  // Popup helper function
  const showPopup = (message, type = 'info') => {
    setPopup({ show: true, message, type });
    // Auto-hide after 4 seconds
    setTimeout(() => setPopup({ show: false, message: '', type: 'info' }), 9000);
  };

  // NFC Scanning function
  const scanNFCCard = async () => {
    setScanning(true);
    setScannedData(null);
    setParsedHealthData(null);

    try {
      showPopup('🔄 Scanning NFC card... Please place card near reader.', 'info');

      const response = await fetch(`${BASE}/scan`);
      const data = await response.json();
      console.log('NFC scan response:', data);

      if (data.ok && data.rfid) {
        setScannedData(data.rfid);
        parseHealthData(data.rfid);
        showPopup('✅ NFC card scanned successfully!', 'success');
      } else {
        throw new Error(data.error || 'Scan failed');
      }
    } catch (error) {
      console.error('NFC scan error:', error);
      showPopup('❌ NFC scan failed: ' + error.message, 'error');
    } finally {
      setScanning(false);
    }
  };

  // Parse health data from NFC payload
  const parseHealthData = (rawData) => {
    try {
      // Expected format: #PATIENT_ID#DATE;NAME;DOSE;DOCTOR
      if (!rawData.startsWith('#') || !rawData.includes('#')) {
        setParsedHealthData({ error: 'Invalid data format' });
        return;
      }

      const parts = rawData.split('#');
      if (parts.length < 3) {
        setParsedHealthData({ error: 'Incomplete data' });
        return;
      }

      const patientId = parts[1];
      const healthData = parts[2];

      if (!healthData) {
        setParsedHealthData({ error: 'No health data found' });
        return;
      }

      // Parse timeline entry: DATE;NAME;DOSE;DOCTOR
      const timelineParts = healthData.split(';');
      const parsed = {
        patientId,
        date: timelineParts[0] || '',
        name: timelineParts[1] || '',
        dose: timelineParts[2] || '',
        doctor: timelineParts[3] || '',
        rawData
      };

      setParsedHealthData(parsed);
    } catch (error) {
      console.error('Data parsing error:', error);
      setParsedHealthData({ error: 'Failed to parse data: ' + error.message });
    }
  };

  const loadPatients = async () => {
    try {
      const res = await fetch(`${BASE}/api/users`);
      if (res.ok) {
        const list = await res.json();
        setPatients(list);
      }
    } catch (e) {
      console.warn('failed to load patients', e);
    }
  };

  const doctorLogin = async () => {
    if (!loginForm.phone || !loginForm.pass) return;
    try {
      const res = await fetch(`${BASE}/api/doctor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      if (res.ok) {
        const info = await res.json();
        setDoctor(info);
        // load list after logging in
        loadPatients();
      } else {
        showPopup('Login failed. Please check your credentials.', 'error');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const signupDoctor = async () => {
    if (!loginForm.phone || !loginForm.pass) return;
    try {
      await fetch(`${BASE}/api/doctor/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginForm.phone, pass: loginForm.pass, name: loginForm.name }),
      });
      showPopup('Account created successfully! You can now log in.', 'success');
    } catch (e) {
      console.warn(e);
    }
  };

  const searchPatient = async () => {
    if (searchPhone) {
      try {
        const res = await fetch(`${BASE}/api/user/${searchPhone}`);
        if (res.ok) {
          const user = await res.json();
          selectPatient(user);
        } else {
          // not found, offer to create
          if (window.confirm('Patient not found. Create new?')) {
            // create minimal account using phone only
            try {
              await fetch(`${BASE}/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '', phone: searchPhone, email: '', pass: 'password' }),
              });
              loadPatients();
              selectPatient({ phone: searchPhone });
            } catch (e) {
              console.warn('failed to create new patient', e);
            }
          }
        }
      } catch (e) { console.warn(e); }
    } else if (searchCard) {
      try {
        const res = await fetch(`${BASE}/api/user/by-card/${searchCard}`);
        if (res.ok) {
          const user = await res.json();
          selectPatient(user);
        } else {
          showPopup('No patient found with this card ID.', 'warning');
        }
      } catch (e) { console.warn(e); }
    }
  };

  const loadDetails = async (phone) => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch(`${BASE}/api/user/${phone}`),
        fetch(`${BASE}/api/user/${phone}/timeline`),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (tRes.ok) setTimeline(await tRes.json());
    } catch (e) {
      console.warn('failed to load details', e);
    }
  };

  const selectPatient =  (patient) => {
    setSelected(patient);
    loadDetails(patient.phone);
  };

  // Send a timeline entry to the server to be written to NFC
  const sendTimelineEntry = async (entry) => {
    if (!selected) return;

    const entryId = entry.id || entry.date + entry.name;
    setSending(prev => ({ ...prev, [entryId]: true }));

    try {
      // Reload profile to ensure latest data
      const pRes = await fetch(`${BASE}/api/user/${selected.phone}`);
      const currentProfile = await pRes.json();

      let patientId = currentProfile.nfcCardId;

      // If patient does NOT have ID → generate one
      if (!patientId) {
        patientId =
          "ID" +
          Date.now()
            .toString()
            .slice(-4); // last 4 digits of timestamp

        // Save ID in DB
        await fetch(`${BASE}/api/user/${selected.phone}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nfcCardId: patientId }),
        });

        showPopup("✨ New Patient ID Generated: " + patientId, 'success');
      }

      // Create timeline string
      const parts = [
        entry.date || "",
        entry.name || "",
        entry.dose || "",
        entry.doctor || "",
      ];

      const timelineData = parts.join(";");

      // FINAL FORMAT
      const payload = `#${patientId}#${timelineData}`;

      // Send to NFC via server
      const writeRes = await fetch(`${BASE}/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payload }),
      });

      if (!writeRes.ok) {
        throw new Error("Failed to write to NFC");
      }

      showPopup("✅ Successfully Sent to NFC:\n" + payload, 'success');
      loadDetails(selected.phone);

    } catch (err) {
      console.error(err);
      showPopup("❌ NFC Send Failed: " + err.message, 'error');
    } finally {
      setSending(prev => ({ ...prev, [entryId]: false }));
    }
  };  const createPatient = async () => {
    if (!newPatient.phone || !newPatient.name) return;
    try {
      await fetch(`${BASE}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPatient.name,
          phone: newPatient.phone,
          email: newPatient.email,
          pass: 'password',
        }),
      });
      setNewPatient({ name: '', phone: '', email: '' });
      loadPatients();
    } catch (e) {
      console.warn('create patient failed', e);
    }
  };

  const addPrescription = async () => {
    if (!selected) return;
    try {
      // generate a short random ID for this prescription
      const prescId = 'ID' + Math.random().toString(36).slice(2, 8).toUpperCase();

      // formatted payload to write to NFC: %<ID>%<summary>
      const summary = `${rxForm.name};${rxForm.dose};${rxForm.doctor};${rxForm.date}`;
      const payload = `%${prescId}%${summary}`;

      // If patient has NFC card, write the prescription to the card and then save via card endpoint
      if (selected.nfcCardId) {
        try {
          const w = await fetch(`${BASE}/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: payload }),
          });
          if (!w.ok) throw new Error('NFC write failed');
        } catch (err) {
          console.error('NFC write failed, aborting prescription add', err);
          showPopup('Failed to write prescription to NFC card', 'error');
          return;
        }

        // include the generated id in the saved entry
        const entry = { ...rxForm, id: prescId };
        await fetch(`${BASE}/api/user/by-card/${selected.nfcCardId}/prescription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } else {
        // Otherwise use phone-based saving and increment count
        const entry = { ...rxForm, id: prescId };
        await fetch(`${BASE}/api/user/${selected.phone}/timeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        await fetch(`${BASE}/api/user/${selected.phone}/count`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: 'prescriptionCount', amount: 1 }),
        });
      }

      setRxForm({ date: todayString(), name: '', dose: '', doctor: '' });
      loadDetails(selected.phone);
      showPopup('Prescription added successfully', 'success');
    } catch (e) {
      console.warn('add rx failed', e);
      showPopup('Failed to add prescription', 'error');
    }
  };

  const addReport = async () => {
    if (!selected) return;
    try {
      await fetch(`${BASE}/api/user/${selected.phone}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reportForm, name: reportForm.title }),
      });
      await fetch(`${BASE}/api/user/${selected.phone}/count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'reportCount', amount: 1 }),
      });
      setReportForm({ date: todayString(), title: '', details: '', type: '' });
      loadDetails(selected.phone);
      showPopup('Report added successfully', 'success');
    } catch (e) {
      console.warn('add report failed', e);
    }
  };

  const addCheckup = async () => {
    if (!selected) return;
    try {
      await fetch(`${BASE}/api/user/${selected.phone}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkupForm, name: 'Checkup', dose: checkupForm.findings }),
      });
      await fetch(`${BASE}/api/user/${selected.phone}/count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'checkupCount', amount: 1 }),
      });
      setCheckupForm({ date: todayString(), findings: '', notes: '', doctor: '' });
      loadDetails(selected.phone);
      showPopup('Checkup recorded successfully', 'success');
    } catch (e) {
      console.warn('add checkup failed', e);
    }
  };

  const addVaccine = async () => {
    if (!selected) return;
    try {
      await fetch(`${BASE}/api/user/${selected.phone}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vaccineForm, dose: vaccineForm.batch }),
      });
      await fetch(`${BASE}/api/user/${selected.phone}/count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'vaccinesCount', amount: 1 }),
      });
      setVaccineForm({ date: todayString(), name: '', batch: '', notes: '' });
      loadDetails(selected.phone);
      showPopup('Vaccine recorded successfully', 'success');
    } catch (e) {
      console.warn('add vaccine failed', e);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  if (!doctor) {
    return (
      <div className="login">
        <h2>Doctor Login</h2>
        <input
          placeholder="Phone"
          value={loginForm.phone}
          onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
        />
        <input
          placeholder="Name (for signup)"
          value={loginForm.name || ''}
          onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={loginForm.pass}
          onChange={(e) => setLoginForm({ ...loginForm, pass: e.target.value })}
        />
        <button onClick={doctorLogin}>Log in</button>
        <button onClick={signupDoctor}>Sign up</button>
      </div>
    );
  }

  return (
    <div className="portal">
      <header className="portal-header">
        <span>Logged in as Dr. {doctor.name || doctor.phone}</span>
        <button onClick={() => setDoctor(null)}>Logout</button>
      </header>
      <aside className="sidebar">
        <h2>Patients</h2>
        <div className="search">
          <input
            placeholder="phone…"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
          />
          <input
            placeholder="card id…"
            value={searchCard}
            onChange={(e) => setSearchCard(e.target.value)}
          />
          <button onClick={searchPatient}>Find</button>
        </div>
        <ul className="patient-list">
          {patients.map((p) => (
            <li
              key={p.phone}
              className={selected && selected.phone === p.phone ? 'selected' : ''}
              onClick={() => selectPatient(p)}
            >
              {p.name || p.phone}
            </li>
          ))}
        </ul>
        <div className="new-patient">
          <h3>Add patient</h3>
          <input
            placeholder="Name"
            value={newPatient.name}
            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
          />
          <input
            placeholder="Phone"
            value={newPatient.phone}
            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
          />
          <input
            placeholder="Email"
            value={newPatient.email}
            onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
          />
          <button onClick={createPatient}>Create</button>
        </div>
      </aside>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${currentView === 'patient' ? 'active' : ''}`}
          onClick={() => setCurrentView('patient')}
        >
          👤 Patient Details
        </button>
        <button
          className={`nav-tab ${currentView === 'nfc' ? 'active' : ''}`}
          onClick={() => setCurrentView('nfc')}
        >
          📡 NFC Scanner
        </button>
      </div>

      <main className="details">
        {currentView === 'patient' && selected && (
          <>
            <h2>{selected.name || selected.phone}</h2>
            {profile && (
              <div className="profile">
                <p>Blood type: {profile.bloodType}</p>
                <p>NFC ID: {profile.nfcCardId}</p>
                <p>Prescriptions: {profile.prescriptionCount}</p>
                <p>Reports: {profile.reportCount}</p>
                <p>Checkups: {profile.checkupCount}</p>
                <p>Vaccines: {profile.vaccinesCount}</p>
                <button
                  onClick={async () => {
                    const blood = prompt('Enter blood type', profile.bloodType || '');
                    let nfcId = profile.nfcCardId;
                    
                    // If patient doesn't have NFC ID, scan one
                    if (!nfcId) {
                      const scanConfirm = window.confirm('No NFC card assigned. Would you like to scan a card?');
                      if (scanConfirm) {
                        try {
                          const scanRes = await fetch(`${BASE}/scan`);
                          if (scanRes.ok) {
                            const scanData = await scanRes.json();
                            nfcId = scanData.rfid;
                            
                            // Write patient phone to the scanned NFC card
                            await fetch(`${BASE}/write`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: selected.phone }),
                            });
                            console.log('NFC card written with patient phone:', selected.phone);
                          } else {
                            showPopup('Failed to scan NFC card', 'error');
                            return;
                          }
                        } catch (err) {
                          console.error('NFC scan/write error:', err);
                          showPopup('NFC operation failed', 'error');
                          return;
                        }
                      } else {
                        return; // User cancelled NFC scan
                      }
                    }
                    
                    if (blood !== null || nfcId) {
                      await fetch(`${BASE}/api/user/${selected.phone}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bloodType: blood, nfcCardId: nfcId }),
                      });
                      loadDetails(selected.phone);
                      showPopup('Profile updated successfully', 'success');
                    }
                  }}
                >
                  Edit profile
                </button>
              </div>
            )}
            <section className="timeline">
              <h3>🩺 Health Timeline</h3>
              {timeline.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '40px' }}>
                  ✨ No entries yet. Add prescriptions, reports, or checkups to get started!
                </p>
              ) : (
                <ul>
                  {timeline.map((e, i) => {
                    const entryId = e.id || e.date + e.name;
                    const isSending = sending[entryId];
                    return (
                      <li key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: isSending ? 0.7 : 1,
                        pointerEvents: isSending ? 'none' : 'auto'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                            {e.date} – {e.name}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {e.dose && `💊 ${e.dose}`}
                            {e.doctor && ` 👨‍⚕️ ${e.doctor}`}
                            {e.findings && ` 📋 ${e.findings}`}
                            {e.notes && ` 📝 ${e.notes}`}
                          </div>
                          {e.id && (
                            <div style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                              fontFamily: 'monospace',
                              background: 'var(--bg-overlay)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}>
                              🆔 {e.id}
                            </div>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => sendTimelineEntry(e)}
                            disabled={isSending}
                            style={{
                              marginLeft: '15px',
                              background: isSending ? 'var(--bg-overlay)' : 'var(--success)',
                              color: isSending ? 'var(--text-muted)' : 'white',
                              border: 'none',
                              padding: '10px 18px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: isSending ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'var(--transition-normal)'
                            }}
                          >
                            {isSending ? (
                              <>
                                <div className="loading" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                📡 Send to NFC
                              </>
                            )}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rx-form">
              <h3>Add Prescription</h3>
              <input
                type="date"
                value={rxForm.date}
                onChange={(e) => setRxForm({ ...rxForm, date: e.target.value })}
              />
              <input
                placeholder="Medicine name"
                value={rxForm.name}
                onChange={(e) => setRxForm({ ...rxForm, name: e.target.value })}
              />
              <input
                placeholder="Dose"
                value={rxForm.dose}
                onChange={(e) => setRxForm({ ...rxForm, dose: e.target.value })}
              />
              <input
                placeholder="Doctor"
                value={rxForm.doctor}
                onChange={(e) => setRxForm({ ...rxForm, doctor: e.target.value })}
              />
              <button onClick={addPrescription}>Submit</button>
            </section>

            <section className="rx-form">
              <h3>Add Report</h3>
              <input
                type="date"
                value={reportForm.date}
                onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
              />
              <input
                placeholder="Report title"
                value={reportForm.title}
                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              />
              <input
                placeholder="Report type (e.g., Blood Test, X-Ray)"
                value={reportForm.type}
                onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
              />
              <textarea
                placeholder="Details"
                value={reportForm.details}
                onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                style={{ height: '80px', padding: '8px', fontSize: '14px' }}
              />
              <button onClick={addReport}>Submit Report</button>
            </section>

            <section className="rx-form">
              <h3>Add Checkup</h3>
              <input
                type="date"
                value={checkupForm.date}
                onChange={(e) => setCheckupForm({ ...checkupForm, date: e.target.value })}
              />
              <input
                placeholder="Findings"
                value={checkupForm.findings}
                onChange={(e) => setCheckupForm({ ...checkupForm, findings: e.target.value })}
              />
              <input
                placeholder="Doctor name"
                value={checkupForm.doctor}
                onChange={(e) => setCheckupForm({ ...checkupForm, doctor: e.target.value })}
              />
              <textarea
                placeholder="Additional notes"
                value={checkupForm.notes}
                onChange={(e) => setCheckupForm({ ...checkupForm, notes: e.target.value })}
                style={{ height: '80px', padding: '8px', fontSize: '14px' }}
              />
              <button onClick={addCheckup}>Submit Checkup</button>
            </section>

            <section className="rx-form">
              <h3>Add Vaccine</h3>
              <input
                type="date"
                value={vaccineForm.date}
                onChange={(e) => setVaccineForm({ ...vaccineForm, date: e.target.value })}
              />
              <input
                placeholder="Vaccine name"
                value={vaccineForm.name}
                onChange={(e) => setVaccineForm({ ...vaccineForm, name: e.target.value })}
              />
              <input
                placeholder="Batch number"
                value={vaccineForm.batch}
                onChange={(e) => setVaccineForm({ ...vaccineForm, batch: e.target.value })}
              />
              <textarea
                placeholder="Notes"
                value={vaccineForm.notes}
                onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })}
                style={{ height: '80px', padding: '8px', fontSize: '14px' }}
              />
              <button onClick={addVaccine}>Submit Vaccine</button>
            </section>
          </>
        )}

        {currentView === 'patient' && !selected && (
          <p>Select a patient to view details</p>
        )}

        {currentView === 'nfc' && (
          <div className="nfc-scanner">
            <h2> NFC Card Scanner</h2>
            <p className="scanner-description">
              Scan patient NFC cards to read their health data and timeline information.
            </p>

            <div className="scan-section">
              <button
                onClick={scanNFCCard}
                disabled={scanning}
                className={`scan-button ${scanning ? 'scanning' : ''}`}
              >
                {scanning ? (
                  <>
                    <div className="loading" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div>
                    Scanning...
                  </>
                ) : (
                  <>
                     Scan NFC Card
                  </>
                )}
              </button>

              {!scanning && (
                <p className="scan-instruction">
                  💡 Place the NFC card near the reader and click "Scan NFC Card"
                </p>
              )}
            </div>

            {parsedHealthData && !parsedHealthData.error && (
  <div className="prescription-wrapper">

    <div className="prescription-card" id="prescription-card">
      
      <div className="prescription-header">
        <h2>🏥 City Hospital</h2>
        <p>General Medical Center</p>
      </div>

      <div className="prescription-body">
        <p><strong>Patient ID:</strong> {parsedHealthData.patientId}</p>
        <p><strong>Date:</strong> {parsedHealthData.date}</p>

        <div className="rx-symbol">℞</div>

        <p><strong>Medicine:</strong> {parsedHealthData.name}</p>
        <p><strong>Dose:</strong> {parsedHealthData.dose}</p>

        <div className="doctor-section">
          <p><strong>Doctor:</strong> {parsedHealthData.doctor}</p>
          <p className="signature">Signature: __________</p>
        </div>
      </div>

    </div>

    <button className="download-btn" onClick={downloadPrescription}>
      📥 Download Prescription
    </button>
  </div>
)}

            

            {!scannedData && !scanning && (
              <div className="empty-state">
                <div className="empty-icon">🔄</div>
                <h3>No Card Scanned Yet</h3>
                <p>Click the scan button above to read an NFC card</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modern Popup Component */}
      {popup.show && (
        <div className="popup-overlay" onClick={() => setPopup({ show: false, message: '', type: 'info' })}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <span className="popup-icon">
                {popup.type === 'success' && '✅'}
                {popup.type === 'error' && '❌'}
                {popup.type === 'warning' && '⚠️'}
                {popup.type === 'info' && 'ℹ️'}
              </span>
              <button 
                className="popup-close" 
                onClick={() => setPopup({ show: false, message: '', type: 'info' })}
              >
                ✕
              </button>
            </div>
            <div className="popup-message">{popup.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
