
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Video from 'react-native-video'; 
import { Home, Users, Calendar, Vote } from 'lucide-react-native'; 


import RepConnect from './RepConnect'; 
import InteractiveCalendar from './Calendar';
import Polls from './interact'; 
import APolls from './ainteract';
import ARepConnect from './aRepConnect';
import ACalendar from './aCalendar';
import { useWindowDimensions } from 'react-native';


export default function SimpleSidebar() {
  const { width } = useWindowDimensions();
const isPhone = width < 768;

  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;

  const toggleSidebar = () => {
    const toValue = sidebarOpen ? -250 : 0;
    setSidebarOpen(!sidebarOpen);
    Animated.timing(sidebarAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    Animated.timing(sidebarAnimation, {
      toValue: -250,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const HomePage = () => (
  <View style={[styles.page, isPhone && { marginTop: 200 }]}>
    <Text style={styles.pageTitle}>Welcome To NextUp.</Text>
    
    
    <Video
      source={{uri: './cac_bg.mp4'}}
      style={styles.video}
      repeat={true}
      muted={true}
      resizeMode="contain"
      paused={false}
    />

    <View style={[styles.functionDesign, isPhone && { flexDirection: 'column', gap: 20 }]}>
  <View style={styles.functionItem}>
  <Users size={100} color={'#007AFF'} />
  <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'rgb(30,30,30)', marginTop: 12, textAlign: 'center' }}>
    Communicate
  </Text>
  <Text style={{ fontSize: 14, color: '#666', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
    Communicate your opinions into a suggestion box for your Representatives
  </Text>
</View>

<View style={styles.functionItem}>
  <Vote size={100} color={'rgb(30,30,30)'} />
  <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'rgb(30,30,30)', marginTop: 12, textAlign: 'center' }}>
    Polls
  </Text>
  <Text style={{ fontSize: 14, color: '#666', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
    Participate in local polls and voice your opinion on key issues.
  </Text>
</View>

<View style={styles.functionItem}>
  <Calendar size={100} color={'rgb(215, 61, 61)'} />
  <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'rgb(30,30,30)', marginTop: 12, textAlign: 'center' }}>
    Calendar
  </Text>
  <Text style={{ fontSize: 14, color: '#666', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
    Stay updated on upcoming community civic events and activities.
  </Text>
</View>

</View>

  </View>
  );

    const RepPage = () => {
      if (selectedValue === 'user'){
        return <RepConnect />
      }else if (selectedValue ==='admin'){
        return <ARepConnect/>
      };
  };

 
  const CalendarPage = () => {
    if (selectedValue === 'user'){
      return <InteractiveCalendar />
    }else if (selectedValue ==='admin'){
      return <ACalendar/>
    };
  }

  const QPage = () => {
    if (selectedValue === 'user'){
      return <Polls />
    }else if (selectedValue ==='admin'){
      return <APolls />
    };
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'Rep_page':
        return <RepPage />;
    case 'calendar':
        return <CalendarPage />;
    case 'q':
    return <QPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.dropdownContainer}>
          <Picker
            selectedValue={selectedValue}
            onValueChange={(itemValue) => setSelectedValue(itemValue)}
            style={styles.dropdown}
            dropdownIconColor="rgba(0,0,0,1)"
          >
            <Picker.Item label="Select..." value="" />
            <Picker.Item label="User" value="user" />
            <Picker.Item label="Admin" value="admin" />
          </Picker>
        </View>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>

      {sidebarOpen && (
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={() => {
            setSidebarOpen(false);
            Animated.timing(sidebarAnimation, {
              toValue: -250,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }}
          activeOpacity={1}
        />
      )}

     
      <Animated.View 
        style={[
          styles.sidebar, 
          { transform: [{ translateX: sidebarAnimation }] }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>NextUp</Text>
          <TouchableOpacity onPress={() => {
          setSidebarOpen(false);
          Animated.timing(sidebarAnimation, {
            toValue: -250,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }}>
            <Text style={styles.closeButton}>☰</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.sidebarItem, activeTab === 'home' && styles.activeSidebarItem]}
          onPress={() => selectTab('home')}
        >
          <View style={styles.sidebarItemContent}>
            <Home 
              size={20} 
              color={activeTab === 'home' ? '#fff' : 'rgb(226, 226, 226)'} 
            />
            <Text style={[styles.sidebarItemText, activeTab === 'home' && styles.activeSidebarItemText]}>
              Home
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarItem, activeTab === 'Rep_page' && styles.activeSidebarItem]}
          onPress={() => selectTab('Rep_page')}
        >
          <View style={styles.sidebarItemContent}>
            <Users 
              size={20} 
              color={activeTab === 'Rep_page' ? '#fff' : 'rgb(226, 226, 226)'} 
            />
            <Text style={[styles.sidebarItemText, activeTab === 'Rep_page' && styles.activeSidebarItemText]}>
              Communicate
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sidebarItem, activeTab === 'q' && styles.activeSidebarItem]}
          onPress={() => selectTab('q')}
        >
          <View style={styles.sidebarItemContent}>
            <Vote
              size={20} 
              color={activeTab === 'q' ? '#fff' : 'rgb(226, 226, 226)'} 
            />
            <Text style={[styles.sidebarItemText, activeTab === 'q' && styles.activeSidebarItemText]}>
              Polls
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarItem, activeTab === 'calendar' && styles.activeSidebarItem]}
          onPress={() => selectTab('calendar')}
        >
          <View style={styles.sidebarItemContent}>
            <Calendar 
              size={20} 
              color={activeTab === 'calendar' ? '#fff' : 'rgb(226, 226, 226)'} 
            />
            <Text style={[styles.sidebarItemText, activeTab === 'calendar' && styles.activeSidebarItemText]}>
              Calendar
            </Text>
          </View>
        </TouchableOpacity>

        
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  functionDesign: {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap:70,
  marginTop: 20,
  
},
 functionItem: { 
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
  
  borderRadius: 16,
  marginBottom: 20,
 
  width: 280, 
  minWidth: 280, 
  maxWidth: 280,
}
,


  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 25, 
  },
  menuButton: {
    marginRight: 15,
  },
  menuButtonText: {
    color: 'rgba(0,0,0,1)',
    fontSize: 30,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 5,
    backgroundColor: 'black',
    minWidth: 120,
  },
  dropdown: {
    height: 40,
    color: 'black',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 250,
    backgroundColor: 'rgb(30,30,30)',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgb(30, 30, 30)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '',
  },
  sidebarItem: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomWidth: 0,
    borderBottomColor: '',
  },
  activeSidebarItem: {
    backgroundColor: '#007AFF',
  },
  sidebarItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarItemText: {
    fontSize: 16,
    color: 'rgb(226, 226, 226)',
    marginLeft: 12,
  },
  activeSidebarItemText: {
    color: '#fff',
    fontWeight: '',
  },
  video: {
    width: 350,
    height: 350,
    borderRadius: 200,
    backgroundColor: '', 
    position: 'relative',
    margin:25,
  },
});