import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

export default function InteractiveCalendar() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sampleEvents, setSampleEvents] = useState({});

 
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/getEvent');
      const events = await response.json();
      
      const groupedEvents = {};
      events.forEach(event => {
        const date = event.event_date;
        if (!groupedEvents[date]) {
          groupedEvents[date] = [];
        }
        groupedEvents[date].push({
          id: event.id || Date.now() + Math.random(),
          title: event.event_name,
          time: event.event_time,
          description: event.event_desc
        });
      });
      
      setSampleEvents(groupedEvents);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch events: ' + error.message);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (year, month, day) => {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
         
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


    weekDays.forEach(day => {
      days.push(
        <View key={`header-${day}`} style={styles.weekDayHeader}>
          <Text style={styles.weekDayText}>{day}</Text>
        </View>
      );
    });


    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }


    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDate(year, month, day);
      console.log(dateKey)
      const events = sampleEvents[dateKey] || [];
      console.log(events);
      const today = isToday(year, month, day);
      const isSelected = selectedDate === dateKey;

      
      

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            today && styles.todayCell,
            isSelected && styles.selectedCell
          ]}
          onPress={() => setSelectedDate(dateKey)}
        >
          <Text style={[
            styles.dayText,
            today && styles.todayText,
            isSelected && styles.selectedText
          ]}>
            {day}
          </Text>
          
          
          
          {events.length > 0 && (
            <View style={styles.eventIndicator}>
              <Text style={styles.eventCount}>{events.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
      
    }

    return days;
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedEvents = selectedDate ? sampleEvents[selectedDate] || [] : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Text style={styles.navButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Text style={styles.navButton}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.calendarContainer}>
          <View style={styles.calendar}>
            {renderCalendar()}
          </View>
        </View>

       
        <View style={styles.sidebar}>
          {selectedDate ? (
            <ScrollView>
              {selectedEvents.length > 0 ? (
                selectedEvents.map(event => (
                  <View key={event.id} style={styles.eventDetail}>
                    <Text style={styles.eventDetailTitle}>{event.title}</Text>
                    <Text style={styles.eventDetailTime}>{event.time}</Text>
                    <Text style={styles.eventDetailDescription}>{event.description}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noEventsText}>No events scheduled</Text>
              )}
            </ScrollView>
          ) : (
            <View style={styles.noSelectionContainer}>
              <Text style={styles.noSelectionText}>Select a date to view events</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  navButton: {
    fontSize: 30,
    color: '#007AFF',
    fontWeight: 'bold',
    paddingHorizontal: 15,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
  },
  calendarContainer: {
    flex: 2,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekDayHeader: {
    width: '14.28%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#007AFF'
  },
  intro_text: {
    fontSize: 18,
    fontWeight: 'semibold',
    marginBottom: 10,
    textAlign: 'center'
  },
  intro_note: {
    textAlign: 'center',
    color: 'rgb(120, 120, 120)',
    marginBottom: 50
  },
  dayCell: {
    width: '14.28%',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  todayCell: {
    backgroundColor: 'rgb(30, 30, 30)',
  },
  todayText: {
    color: 'rgb(255, 255, 255)',
    fontWeight: 'bold',
  },
  selectedCell: {
    backgroundColor: '#bbdefb',
  },
  selectedText: {
    color: '#0d47a1',
    fontWeight: 'bold',
  },
  eventItem: {
    backgroundColor: '#e8f5e8',
    marginTop: 1,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    width: '100%',
    minHeight: 16,
  },
  eventTitle: {
    fontSize: 8,
    color: '#2e7d32',
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 6,
    color: '#388e3c',
  },
  eventIndicator: {
  backgroundColor: 'rgb(0, 0, 0)',
  borderRadius: 8,
  minWidth: 16,
  height: 16,
  marginTop: 10,
  justifyContent: 'center',       
  alignItems: 'center',            
},
  eventCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sidebar: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSelectionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  eventDetail: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 0,
    borderLeftColor: '#007AFF',
  },
  eventDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  eventDetailTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventDetailDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  noEventsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});