import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal } from 'react-native';
import { Trash2 } from 'lucide-react-native';

export default function InteractiveCalendar() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    time: '',
    description: ''
  });
  const [sampleEvents, setSampleEvents] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);


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
          id: event.id,
          title: event.event_name,
          time: event.event_time,
          description: event.event_desc
        });
      });
      
      setSampleEvents(groupedEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error.message);
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

  const openAddEventModal = () => {
    setEventForm({ title: '', time: '', description: '' });
    setEditingEvent(null);
    setModalVisible(true);
  };

  const openEditEventModal = (event) => {
    setEventForm({ 
      title: event.title, 
      time: event.time, 
      description: event.description 
    });
    setEditingEvent(event);
    setModalVisible(true);
  };

  const saveEvent = async () => {
    if (!selectedDate || !eventForm.title.trim()) {
      console.log('Error: Please enter an event title');
      return;
    }

    try {
      if (editingEvent) {
        const formData = new FormData();
        formData.append('event_name', eventForm.title.trim());
        formData.append('event_date', selectedDate);
        formData.append('event_time', eventForm.time.trim() || 'TBD');
        formData.append('event_desc', eventForm.description.trim());

        const response = await fetch(`http://localhost:8000/api/editEvent/${editingEvent.id}`, {
          method: 'PUT',
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
          await fetchEvents();
          setModalVisible(false);
          setEventForm({ title: '', time: '', description: '' });
          setEditingEvent(null);
          console.log('Event updated successfully!');
        } else {
          console.error('Error:', result.error || 'Failed to update event');
        }
      } else {
        const formData = new FormData();
        formData.append('event_name', eventForm.title.trim());
        formData.append('event_date', selectedDate);
        formData.append('event_time', eventForm.time.trim() || 'TBD');
        formData.append('event_desc', eventForm.description.trim());

        const response = await fetch('http://localhost:8000/api/addEvent', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
          await fetchEvents();
          setModalVisible(false);
          setEventForm({ title: '', time: '', description: '' });
          console.log('Event added successfully!');
        } else {
          console.error('Error:', result.error || 'Failed to add event');
        }
      }
    } catch (error) {
      console.error('Network error:', error.message);
    }
  };

  const deleteEvent = (eventId) => {
    let eventName = 'this event';
    for (const date in sampleEvents) {
      const event = sampleEvents[date].find(e => e.id === eventId);
      if (event) {
        eventName = event.title;
        break;
      }
    }
    
    setDeleteConfirmation({ id: eventId, eventName });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirmation;
    setDeleteConfirmation(null);
    
    try {
      console.log(`Attempting to delete event with ID: ${id}`);
      
      const response = await fetch(`http://localhost:8000/api/deleteEvent/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Delete failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Delete response:", result);
      
      await fetchEvents();
      
      console.log('Event deleted successfully');
      
    } catch (error) {
      console.error('Error deleting event:', error);
      console.log(`Failed to delete event: ${error.message}`);
      await fetchEvents();
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
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
      const events = sampleEvents[dateKey] || [];
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
              <View style={styles.sidebarHeader}>
                <Text style={styles.selectedDateTitle}>
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={openAddEventModal}
                >
                  <Text style={styles.addButtonText}>+ Add Event</Text>
                </TouchableOpacity>
              </View>

              {selectedEvents.length > 0 ? (
                selectedEvents.map(event => (
                  <View key={event.id} style={styles.eventDetail}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventDetailTitle}>{event.title}</Text>
                      <View style={styles.eventActions}>
                        <TouchableOpacity 
                          onPress={() => openEditEventModal(event)}
                          style={styles.editButton}
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => deleteEvent(event.id)}
                        >
                          <Trash2 size={14} color="#ff4444" />
                          <Text style={[styles.actionButtonText, { color: '#ff4444' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
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
              <Text style={styles.noSelectionText}>Select a date to view/manage events</Text>
            </View>
          )}
        </View>
      </View>

     
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </Text>
            
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              value={eventForm.title}
              onChangeText={(text) => setEventForm({...eventForm, title: text})}
              placeholder="Enter event title"
            />

            <Text style={styles.label}>Time</Text>
            <TextInput
              style={styles.input}
              value={eventForm.time}
              onChangeText={(text) => setEventForm({...eventForm, time: text})}
              placeholder="e.g., 10:00 AM or All Day"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={eventForm.description}
              onChangeText={(text) => setEventForm({...eventForm, description: text})}
              placeholder="Enter event description"
              multiline={true}
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveEvent}
              >
                <Text style={styles.saveButtonText}>
                  {editingEvent ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      
      {deleteConfirmation && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={true}
          onRequestClose={cancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Event</Text>
              <Text style={styles.deleteConfirmText}>
                Are you sure you want to delete "{deleteConfirmation.eventName}"?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={cancelDelete}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={confirmDelete}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  sidebarHeader: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgb(30,30,30)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteConfirmText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
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
});