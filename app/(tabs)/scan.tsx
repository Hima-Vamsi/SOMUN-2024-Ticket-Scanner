import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";

export default function Scan({}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const days = [
    { label: "Select a day", value: "", displayValue: "Select a day" },
    { label: "Day 1", value: "day1", displayValue: "Day 1" },
    { label: "Day 2", value: "day2", displayValue: "Day 2" },
    { label: "Day 3", value: "day3", displayValue: "Day 3" },
  ];

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setTransactionId(data);
    fetchUserData(data);
  };

  const fetchUserData = async (transactionId) => {
    try {
      const response = await fetch(
        `${global.API_BASE_URL}/user/${transactionId}`
      );
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setModalVisible(true);
      } else if (response.status === 404) {
        Alert.alert("Not Found", "User not found.");
      } else {
        Alert.alert("Error", "An error occurred while fetching user data.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to connect to the server.");
    }
  };

  const updateAttendance = async () => {
    if (!selectedDay) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `${global.API_BASE_URL}/user/${transactionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ day: selectedDay }),
        }
      );

      const result = await response.json();

      if (result.alreadyPresent) {
        Alert.alert(
          "Already Present",
          `${user.name} is already marked present for ${
            days.find((day) => day.value === selectedDay)?.displayValue
          }.`,
          [
            {
              text: "Close",
              onPress: () => {},
            },
          ]
        );
      } else {
        Alert.alert(
          "Success",
          `Attendance for ${user.name} on ${
            days.find((day) => day.value === selectedDay)?.displayValue
          } marked successfully.`,
          [
            {
              text: "Close",
              onPress: () => setModalVisible(false),
            },
          ]
        );
        setUser(result);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to connect to the server.");
    } finally {
      setIsUpdating(false);
      setSelectedDay("");
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centeredView}>
        <Text>Requesting for camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centeredView}>
        <Text>No access to camera.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scanned && (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {scanned && (
        <View style={styles.centeredView}>
          <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
        </View>
      )}

      {/* Modal for User Details and Attendance Update */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (!isUpdating) {
            setModalVisible(false);
            setSelectedDay("");
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            {user ? (
              <>
                <Text style={styles.modalTitle}>User Details</Text>
                <Text>Name: {user.name}</Text>
                <Text>Email: {user.email}</Text>
                <Text>Phone: {user.phone}</Text>

                <Text style={styles.pickerLabel}>Select Day:</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Text>
                    {selectedDay
                      ? days.find((day) => day.value === selectedDay)
                          ?.displayValue
                      : "Select a day"}
                  </Text>
                </TouchableOpacity>

                {dropdownOpen && (
                  <FlatList
                    data={days}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedDay(item.value);
                          setDropdownOpen(false);
                        }}
                      >
                        <Text>{item.label}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.value}
                    style={styles.dropdownList}
                  />
                )}

                {isUpdating && (
                  <ActivityIndicator size="small" color="#0000ff" />
                )}

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonClose]}
                    onPress={() => {
                      if (!isUpdating) {
                        setModalVisible(false);
                        setSelectedDay("");
                      }
                    }}
                    disabled={isUpdating}
                  >
                    <Text style={styles.textStyle}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.buttonConfirm,
                      !selectedDay || isUpdating ? styles.buttonDisabled : {},
                    ]}
                    onPress={updateAttendance}
                    disabled={!selectedDay || isUpdating}
                  >
                    <Text style={styles.textStyle}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <ActivityIndicator size="large" color="#0000ff" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  pickerLabel: {
    marginTop: 10,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  dropdownList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: "#f44336",
  },
  buttonConfirm: {
    backgroundColor: "#2196F3",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
