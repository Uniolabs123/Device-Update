#include <WiFi.h>

// Set your desired network name (SSID) and password here
const char *ssid = "ESP32_Test_Network";
const char *password = "12345678"; // Password must be at least 8 characters long

void setup() {
  // Start the Serial Monitor for debugging
  Serial.begin(115200);
  Serial.println();
  
  Serial.println("Configuring Access Point...");

  // Start the ESP32 in Access Point (AP) mode
  WiFi.softAP(ssid, password);

  // Get and print the IP address of the ESP32
  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(myIP);
  
  Serial.println("Wi-Fi is on! Check your mobile device.");
}

void loop() {
  // Nothing needs to be in the loop for the Wi-Fi to remain active
}