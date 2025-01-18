import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";

global.API_BASE_URL = "http://localhost:3000";

export default function APIUrlInput() {
  const [apiUrl, setApiUrl] = useState(global.API_BASE_URL);
  const [isLocked, setIsLocked] = useState(false);

  const toggleLock = () => {
    setIsLocked(!isLocked);
    if (!isLocked) {
      global.API_BASE_URL = apiUrl;
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={apiUrl}
        onChangeText={setApiUrl}
        placeholder="Enter API Base URL"
        editable={!isLocked}
      />
      <Button
        title={isLocked ? "Modify API URL" : "Lock API URL"}
        onPress={toggleLock}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    color: "white",
  },
});
