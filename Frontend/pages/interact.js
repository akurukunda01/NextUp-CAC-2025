import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Modal
} from 'react-native';

const API_BASE_URL = 'http://localhost:8000/api';

const UserPage = () => {
  const [polls, setPolls] = useState([]);
  const [pollOptions, setPollOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [textResponses, setTextResponses] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getPolls`);
      const data = await response.json();
      setPolls(data);
      for (const poll of data) {
        await fetchPollOptions(poll.id);
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPollOptions = async (pollId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/getPollOptions/${pollId}`);
      const data = await response.json();
      setPollOptions(prev => ({
        ...prev,
        [pollId]: data.options
      }));
    } catch (error) {
      console.error(`Failed to fetch options for poll ${pollId}:`, error);
    }
  };

  const submitResponse = async (pollId, selectedOptionId = null, textResponse = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pollResponse/${pollId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_option_id: selectedOptionId,
          text_response: textResponse,
        }),
      });

      if (response.ok) {
        setShowSuccessModal(true);
        if (textResponse) {
          setTextResponses({ ...textResponses, [pollId]: '' });
        }
       
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2500);
      } else {
        console.error('Failed to submit response');
      }
    } catch (error) {
      console.error('Network error occurred:', error);
    }
  };

  const handleTextSubmit = (pollId) => {
    const textResponse = textResponses[pollId];
    if (!textResponse || textResponse.trim() === '') {
      console.warn('Please enter your response');
      return;
    }
    submitResponse(pollId, null, textResponse.trim());
  };

  const renderYesNoOptions = (poll) => {
    const options = pollOptions[poll.id] || [];
    if (options.length === 0) return null;

    const yesOption = options.find(opt => opt.text === 'Yes');
    const noOption = options.find(opt => opt.text === 'No');

    return (
      <View style={styles.optionsContainer}>
        {yesOption && (
          <TouchableOpacity
            style={[styles.optionButton, styles.yesButton]}
            onPress={() => submitResponse(poll.id, yesOption.id)}
          >
            <Text style={styles.optionText}>Yes</Text>
          </TouchableOpacity>
        )}
        {noOption && (
          <TouchableOpacity
            style={[styles.optionButton, styles.noButton]}
            onPress={() => submitResponse(poll.id, noOption.id)}
          >
            <Text style={styles.optionText}>No</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderYesNoMaybeOptions = (poll) => {
    const options = pollOptions[poll.id] || [];
    if (options.length === 0) return null;

    const yesOption = options.find(opt => opt.text === 'Yes');
    const noOption = options.find(opt => opt.text === 'No');
    const maybeOption = options.find(opt => opt.text === 'Maybe');

    return (
      <View style={styles.optionsContainer}>
        {yesOption && (
          <TouchableOpacity
            style={[styles.optionButton, styles.yesButton]}
            onPress={() => submitResponse(poll.id, yesOption.id)}
          >
            <Text style={styles.optionText}>Yes</Text>
          </TouchableOpacity>
        )}
        {maybeOption && (
          <TouchableOpacity
            style={[styles.optionButton, styles.maybeButton]}
            onPress={() => submitResponse(poll.id, maybeOption.id)}
          >
            <Text style={styles.optionText}>Maybe</Text>
          </TouchableOpacity>
        )}
        {noOption && (
          <TouchableOpacity
            style={[styles.optionButton, styles.noButton]}
            onPress={() => submitResponse(poll.id, noOption.id)}
          >
            <Text style={styles.optionText}>No</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderShortAnswer = (poll) => (
    <View style={styles.shortAnswerContainer}>
      <TextInput
        style={styles.textInput}
        placeholder="Enter your response..."
        multiline
        numberOfLines={4}
        value={textResponses[poll.id] || ''}
        onChangeText={(text) => 
          setTextResponses({ ...textResponses, [poll.id]: text })
        }
      />
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => handleTextSubmit(poll.id)}
      >
        <Text style={styles.submitButtonText}>Submit Response</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPollOptions = (poll) => {
    switch (poll.poll_type) {
      case 'yes_no':
        return renderYesNoOptions(poll);
      case 'yes_no_maybe':
        return renderYesNoMaybeOptions(poll);
      case 'short_answer':
        return renderShortAnswer(poll);
      default:
        return <Text style={styles.errorText}>Unknown poll type</Text>;
    }
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading polls...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.mainTitle}>Community Polls</Text>
        <Text style={styles.introText}>Share your opinion on important community issues</Text>
        <Text style={styles.introNote}>Your voice matters - participate in polls created by your representative</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Available Polls</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchPolls}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {polls.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.noPolls}>No polls available at the moment</Text>
          </View>
        ) : (
          polls.map((poll) => (
            <View key={poll.id} style={styles.pollCard}>
              <Text style={styles.pollTitle}>{poll.title}</Text>
              
              <View style={styles.pollInfo}>
                <Text style={styles.pollDate}>
                  Created: {new Date(poll.created_at).toLocaleDateString()}
                </Text>
                {poll.expires_at && (
                  <Text style={[
                    styles.expiryDate,
                    isExpired(poll.expires_at) && styles.expiredText
                  ]}>
                    {isExpired(poll.expires_at) ? 'Expired: ' : 'Expires: '}
                    {new Date(poll.expires_at).toLocaleDateString()}
                  </Text>
                )}
              </View>

              {isExpired(poll.expires_at) ? (
                <View style={styles.expiredContainer}>
                  <Text style={styles.expiredMessage}>This poll has expired</Text>
                </View>
              ) : (
                <View style={styles.votingSection}>
                  {renderPollOptions(poll)}
                </View>
              )}
            </View>
          ))
        )}
      </View>

     
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>Your poll response has been submitted</Text>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    margin:10
  },
  headerSection: {
    padding: 20,
    backgroundColor: '',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#007AFF',
  },
  introText: {
    fontSize: 18,
    fontWeight: 'semibold',
    marginBottom: 10,
    textAlign: 'center',
  },
  introNote: {
    textAlign: 'center',
    color: 'rgb(120, 120, 120)',
    marginBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-left',
    alignItems: 'center',
    padding:25,
    backgroundColor: '',
    
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  refreshButton: {
    backgroundColor: 'black',
    color:"rgb(255, 255, 255)",
    paddingHorizontal: 12,
    marginHorizontal:20,
    paddingVertical: 6,
    borderRadius: 30,
  },
  refreshButtonText: {
    fontSize: 14,
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  noPolls: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pollCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    
   
  },
  pollTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pollInfo: {
    marginBottom: 16,
  },
  pollType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pollDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 12,
    color: '#999',
  },
  expiredText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  votingSection: {
    
    paddingTop: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  yesButton: {
    backgroundColor: '#007AFF',
  },
  noButton: {
    backgroundColor: '#dc3545',
  },
  maybeButton: {
    backgroundColor: 'rgb(30,30,30)',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  shortAnswerContainer: {
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius:8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 12,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: 'rgb(30,30,30)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expiredContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 16,
  },
  expiredMessage: {
    color: '#721c24',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
 
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  closeModalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserPage;