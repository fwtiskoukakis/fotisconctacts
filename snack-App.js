import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Import your components
import ContractList from './app/index';
import NewContract from './app/new-contract';
import ContractDetails from './app/contract-details';
import EditContract from './app/edit-contract';
import UserManagement from './app/user-management';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={ContractList} 
            options={{ title: 'Ενοικιάσεις Πειραιάς' }}
          />
          <Stack.Screen 
            name="NewContract" 
            component={NewContract} 
            options={{ title: 'Νέο Συμβόλαιο' }}
          />
          <Stack.Screen 
            name="ContractDetails" 
            component={ContractDetails} 
            options={{ title: 'Λεπτομέρειες Συμβολαίου' }}
          />
          <Stack.Screen 
            name="EditContract" 
            component={EditContract} 
            options={{ title: 'Επεξεργασία Συμβολαίου' }}
          />
          <Stack.Screen 
            name="UserManagement" 
            component={UserManagement} 
            options={{ title: 'Διαχείριση Χρηστών' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
