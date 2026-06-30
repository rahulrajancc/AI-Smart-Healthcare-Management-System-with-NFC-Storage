#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

// We will use sector 1 (blocks 4,5,6 usable)
byte startBlock = 4;
byte totalBlocks = 3;  // 4,5,6

void waitForCard() {
  while (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(50);
  }
}

void setup() {
  Serial.begin(9600);
  delay(2000);
  SPI.begin();
  rfid.PCD_Init();

  for (byte i = 0; i < 6; i++)
    key.keyByte[i] = 0xFF;

  Serial.println("READY");
}

void loop() {

  if (!Serial.available()) return;

  String cmd = Serial.readStringUntil('\n');
  cmd.trim();

  // ================= READ =================
  if (cmd == "1") {

    waitForCard();

    Serial.print("DATA:");

    for (byte b = 0; b < totalBlocks; b++) {

      byte block = startBlock + b;
      byte buffer[18];
      byte size = sizeof(buffer);

      rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(rfid.uid));
      rfid.MIFARE_Read(block, buffer, &size);

      for (int i = 0; i < 16; i++) {
        if (buffer[i] != 0)
          Serial.write(buffer[i]);
      }
    }

    Serial.println();
    resetRFID();
  }

  // ================= WRITE =================
  if (cmd.startsWith("0|")) {

  String data = cmd.substring(2);

  Serial.println("WAITING_FOR_CARD");

  waitForCard();

  int dataIndex = 0;

  for (byte b = 0; b < totalBlocks; b++) {

    byte block = startBlock + b;
    byte writeData[16] = {0};

    for (int i = 0; i < 16 && dataIndex < data.length(); i++) {
      writeData[i] = data[dataIndex++];
    }

    rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(rfid.uid));

    MFRC522::StatusCode status;
    status = rfid.MIFARE_Write(block, writeData, 16);

    if (status != MFRC522::STATUS_OK) {
      Serial.println("WRITE_FAIL");
      resetRFID();
      return;
    }
  }

  Serial.println("WRITE_OK");
  resetRFID();
}
}

void resetRFID() {
  rfid.PCD_StopCrypto1();
  rfid.PICC_HaltA();
  rfid.PCD_Reset();
  rfid.PCD_Init();
  delay(50);
}