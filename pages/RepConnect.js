import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Send } from 'lucide-react-native';

export default function BasicForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

 
  const API_BASE_URL = 'http://localhost:8000'; 

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('message', message.trim());

      const response = await fetch(`${API_BASE_URL}/api/sendMessage`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
       
        const newSubmission = {
          id: Date.now(),
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          timestamp: new Date().toLocaleString(),
        };
        
        
        
     
        setName('');
        setEmail('');
        setMessage('');
        
        setShowSuccessModal(true);
      } else {
        throw new Error(result.error || 'Failed to submit message');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearHistory = () => {
    fetchMessages(); 
  };
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/messages`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        
        
        const transformedMessages = data.map((msg, index) => ({
          id: index + 1, 
          name: msg.sender,
          email: msg.email,
          message: msg.message,
          timestamp: new Date(msg.timestamp).toLocaleString(),
          isRead: msg.is_read,
          priority: 'medium' 
        }));
        
        setSubmissions(transformedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', 'Failed to load messages. Please try again.');
      } 
        
    };
  
 
    useEffect(() => {
      fetchMessages();
    }, []);


  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
      <Text style={styles.title}>Connect with your Representative today!</Text>
      <Text style={styles.intro_text}>Give your opinion straight to your Congressional Rep. Make your voice be heard!</Text>
      <Text style={styles.intro_note}>Note: This serves like a suggestion box. Representatives are in no way obligated to respond, nor should you be expecting one. </Text>
      
      <View style={styles.responsiveContainer}>
        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
            selectionColor={"rgb(0,0,0)"}
            editable={!isSubmitting}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Your Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            selectionColor={"rgb(0,0,0)"}
            editable={!isSubmitting}
          />
          
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Your Message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            selectionColor={"rgb(0,0,0)"}
            editable={!isSubmitting}
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <View style={styles.submitButtonContent}>
              <Send size={18} color="#fff" style={styles.submitButtonIcon} />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Sending...' : 'Submit'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <View style={styles.historyTitleContainer}>
              <Text style={styles.historyTitle}>Past Submissions</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{submissions.length}</Text>
              </View>
            </View>
            {submissions.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
                <Text style={styles.clearButtonText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>

          {submissions.length === 0 ? (
            <View>
              <Text style={styles.emptyStateSubtitle}>No submissions yet</Text>
            </View>
          ) : (
            <ScrollView style={styles.submissionsScrollView} nestedScrollEnabled={true}>
              {submissions.map((submission, index) => (
                <View key={submission.id} style={styles.submissionCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {submission.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.submissionName}>{submission.name}</Text>
                      <Text style={styles.submissionEmail}>{submission.email}</Text>
                    </View>
                    <Text style={styles.submissionNumber}>#{index + 1}</Text>
                  </View>
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageLabel}>Message:</Text>
                    <Text style={styles.submissionMessage}>{submission.message}</Text>
                  </View>

     
                  <View style={styles.cardFooter}>
                    <View style={styles.timestampContainer}>
                      <Text style={styles.submissionTime}>{submission.timestamp}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

      </View>


      {showSuccessModal && (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.confirmationTitle}>Message Sent!</Text>
            <Text style={styles.confirmationText}>
              Your suggestion has been successfully sent to your representative.
            </Text>
            <TouchableOpacity 
              style={styles.okButton} 
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: '',
    padding: 20,
  },
  responsiveContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
  },
  formSection: {
    flex: 1,
    minWidth: 150,
    marginBottom: 0,
    paddingVertical: 30,
    paddingHorizontal: 30,
    margin: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  historySection: {
    flex: 1,
    minWidth: 300,
    maxHeight: 600,
  },
  submissionsScrollView: {
    flex: 1,
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
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 25,
    backgroundColor: '#f9f9f9',
    color: 'rgb(102, 101, 101)'
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: 'rgb(30,30,30)',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  historyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
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
  clearButton: {
    backgroundColor: 'rgb(231, 60, 60)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  submissionsList: {
    gap: 15,
  },
  submissionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
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
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardHeaderText: {
    flex: 1,
  },
  submissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  submissionEmail: {
    fontSize: 14,
    color: '#666',
  },
  submissionNumber: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 0,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  submissionMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
    padding: 30,
    margin: 20,
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  okButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 120,
  },
  okButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});