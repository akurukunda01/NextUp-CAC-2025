import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Mail, Trash2, Eye, EyeOff, Filter, Search } from 'lucide-react-native';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [clearAllConfirmation, setClearAllConfirmation] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');


  const API_BASE_URL = 'http://localhost:8000';


  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
   
      const transformedMessages = data.map((msg) => ({
        id: msg.id,
        name: msg.sender,
        email: msg.email,
        message: msg.message,
        timestamp: new Date(msg.timestamp).toLocaleString(),
        isRead: msg.is_read,
        priority: 'medium'
      }));
      
      setMessages(transformedMessages);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      console.log(`Failed to load messages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

 
  useEffect(() => {
    fetchMessages();
  }, []);


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  const markAsRead = async (id) => {
    try {

      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === id ? { ...msg, isRead: true } : msg
        )
      );
      

      const response = await fetch(`${API_BASE_URL}/api/messages/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark message as read: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Mark as read response:", result);
      
    } catch (error) {
      console.error('Error marking message as read:', error);
      console.log('Failed to mark message as read');
      await fetchMessages();
    }
  };

  const markAsUnread = async (id) => {
    try {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === id ? { ...msg, isRead: false } : msg
        )
      );

      const response = await fetch(`${API_BASE_URL}/api/messages/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: false })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark message as unread: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Mark as unread response:", result);
      
    } catch (error) {
      console.error('Error marking message as unread:', error);
      console.log('Failed to mark message as unread');
      await fetchMessages();
    }
  };

  const deleteMessage = (id) => {
    const messageToDelete = messages.find(msg => msg.id === id);
    const messageName = messageToDelete ? messageToDelete.name : 'Unknown';
    
    setDeleteConfirmation({ id, messageName });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirmation;
    setDeleteConfirmation(null);
    
    try {
      console.log(`Attempting to delete message with ID: ${id}`);
      
      const response = await fetch(`${API_BASE_URL}/api/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Delete failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Delete response:", result);
      

      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== id));
      
      console.log('Message deleted successfully');
      
    } catch (error) {
      console.error('Error deleting message:', error);
      console.log(`Failed to delete message: ${error.message}`);
      await fetchMessages();
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const clearAllMessages = () => {
    setClearAllConfirmation(true);
  };

  const confirmClearAll = async () => {
    setClearAllConfirmation(false);
    
    try {
      console.log("Attempting to clear all messages");
      
      const response = await fetch(`${API_BASE_URL}/api/clearMessages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Clear failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Clear all response:", result);
      setMessages([]);
      
      console.log(result.message || 'All messages cleared successfully');
      
    } catch (error) {
      console.error('Error clearing messages:', error);
      console.log(`Failed to clear messages: ${error.message}`);

      await fetchMessages();
    }
  };

  const cancelClearAll = () => {
    setClearAllConfirmation(false);
  };


  const getFilteredAndSortedMessages = () => {
    let filtered = [...messages];
    

    if (filterStatus === 'read') {
      filtered = filtered.filter(msg => msg.isRead);
    } else if (filterStatus === 'unread') {
      filtered = filtered.filter(msg => !msg.isRead);
    }
    

    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };


  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666', fontSize: 16 }}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.intro_text}>Review and manage messages from your constituents</Text>
      <Text style={styles.intro_note}>Stay connected with your community and respond to their concerns</Text>

      <View style={styles.responsiveContainer}>
        <View style={styles.controlsSection}>
          <View style={styles.messagesTitleContainer}>
            <Text style={styles.messagesTitle}>Constituent Messages</Text>
              <View style={styles.countBadge}>
                
                <Text style={styles.countText}>{getFilteredAndSortedMessages().length}</Text>
              </View>
            </View>
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Messages:</Text>
              <Text style={styles.statValue}>{messages.length}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Unread:</Text>
              <Text style={[styles.statValue, { color: unreadCount > 0 ? '#ef4444' : '#10b981' }]}>
                {unreadCount}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Read:</Text>
              <Text style={[styles.statValue, { color: 'rgb(31, 31, 31)' }]}>
                {messages.length - unreadCount}
              </Text>
            </View>
          </View>

         
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filter by Status:</Text>
            
            <TouchableOpacity 
              style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]} 
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
                All Messages
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, filterStatus === 'unread' && styles.filterButtonActive]} 
              onPress={() => setFilterStatus('unread')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'unread' && styles.filterButtonTextActive]}>
                Unread Only
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, filterStatus === 'read' && styles.filterButtonActive]} 
              onPress={() => setFilterStatus('read')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'read' && styles.filterButtonTextActive]}>
                Read Only
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Sort by Date:</Text>
            
            <TouchableOpacity 
              style={[styles.filterButton, sortOrder === 'newest' && styles.filterButtonActive]} 
              onPress={() => setSortOrder('newest')}
            >
              <Text style={[styles.filterButtonText, sortOrder === 'newest' && styles.filterButtonTextActive]}>
                Newest First
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, sortOrder === 'oldest' && styles.filterButtonActive]} 
              onPress={() => setSortOrder('oldest')}
            >
              <Text style={[styles.filterButtonText, sortOrder === 'oldest' && styles.filterButtonTextActive]}>
                Oldest First
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            
            
            {messages.length > 0 && (
              <TouchableOpacity style={styles.clearAllButton} onPress={clearAllMessages}>
                <Text style={styles.clearAllButtonText}>Clear All Messages</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        
        <View style={styles.messagesSection}>
          

          {getFilteredAndSortedMessages().length === 0 ? (
            <View style={styles.emptyState}>
              <Mail size={48} color="#94a3b8" />
              <Text style={styles.emptyStateText}>No messages found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {filterStatus !== 'all' || messages.length === 0
                  ? 'Try adjusting your filters'
                  : 'Messages from constituents will appear here'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.messagesScrollView} nestedScrollEnabled={true}>
              {getFilteredAndSortedMessages().map((message, index) => (
                <View key={message.id} style={[
                  styles.messageCard,
                  !message.isRead && styles.unreadCard
                ]}>
                 
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {message.name.charAt(0).toUpperCase()}
                      </Text>
                      {!message.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={[styles.messageName, !message.isRead && styles.unreadText]}>
                        {message.name}
                      </Text>
                      <Text style={styles.messageEmail}>{message.email}</Text>
                    </View>
                    <View style={styles.messageMetadata}>
                      <Text style={styles.messageNumber}>#{index + 1}</Text>
                    </View>
                  </View>

                 
                  <View style={styles.messageContent}>
                    <Text style={styles.messageText}>{message.message}</Text>
                  </View>

                 
                  <View style={styles.cardFooter}>
                    <View style={styles.timestampContainer}>
                      <Text style={styles.messageTime}>{message.timestamp}</Text>
                    </View>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => message.isRead ? markAsUnread(message.id) : markAsRead(message.id)}
                      >
                        {message.isRead ? (
                          <>
                            <EyeOff size={14} color="#007AFF" />
                            <Text style={styles.actionButtonText}>Mark Unread</Text>
                          </>
                        ) : (
                          <>
                            <Eye size={14} color="#007AFF" />
                            <Text style={styles.actionButtonText}>Mark Read</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteMessage(message.id)}
                      >
                        <Trash2 size={14} color="#ff4444" />
                        <Text style={[styles.actionButtonText, { color: '#ff4444' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      
      {deleteConfirmation && (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Delete Message</Text>
            <Text style={styles.confirmationText}>
              Are you sure you want to delete the message from {deleteConfirmation.messageName}?
            </Text>
            <View style={styles.confirmationButtons}>
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
      )}

      
      {clearAllConfirmation && (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Clear All Messages</Text>
            <Text style={styles.confirmationText}>
              Are you sure you want to delete all {messages.length} messages? This action cannot be undone.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={cancelClearAll}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={confirmClearAll}
              >
                <Text style={styles.deleteButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 12,
    backgroundColor: '',
    padding: 20,
  },
  responsiveContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
  },
  controlsSection: {
    flex: 1,
    minWidth: 50,
    marginBottom: 0,
    paddingVertical: 50,
    paddingHorizontal: 40,
    margin: 0,
    borderRadius: 8,
    backgroundColor: '#fff',
    height: ''
  },
  messagesSection: {
    flex: 3,
    minWidth: 300,
    height: '',
  },
  messagesScrollView: {
    maxHeight: 600,
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
  statsContainer: {
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  filterSection: {
    marginBottom: 30,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  filterButton: {
    backgroundColor: 'rgb(242, 242, 242)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgb(166, 166, 166)',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  clearAllButton: {
    backgroundColor: 'rgb(30,30,30)',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  messagesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  messagesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
    
  },
  countBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  messagesList: {
    gap: 15,
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    marginBottom: 15,
  },
  unreadCard: {
    borderLeftColor: '#007AFF',
    backgroundColor: 'white',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  cardHeaderText: {
    flex: 1,
  },
  messageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  messageEmail: {
    fontSize: 14,
    color: '#666',
  },
  messageMetadata: {
    alignItems: 'flex-end',
  },
  messageNumber: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  messageContent: {
    marginVertical: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
  },
  confirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmationModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});