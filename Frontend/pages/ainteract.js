import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Trash2 } from 'lucide-react-native';

const API_BASE_URL = 'http://localhost:8000/api';
const screenWidth = Dimensions.get('window').width;

const AdminPage = () => {
  const [polls, setPolls] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pollToDelete, setPollToDelete] = useState(null);
  const [newPoll, setNewPoll] = useState({
    title: '',
    poll_type: 'yes_no',
    expires_at: ''
  });
  const [expirationDays, setExpirationDays] = useState('7');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [pollResults, setPollResults] = useState([]);
  const [showAllResponses, setShowAllResponses] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getPolls`);
      const data = await response.json();
      setPolls(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch polls');
    }
  };

  const createPoll = async () => {
    if (!newPoll.title) {
      Alert.alert('Error', 'Poll title is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', newPoll.title);
      formData.append('poll_type', newPoll.poll_type);
      
      if (expirationDays && parseInt(expirationDays) > 0) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(expirationDays));
        const formattedDate = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
        formData.append('expires_at', formattedDate);
      } else {
        formData.append('expires_at', '');
      }

      const response = await fetch(`${API_BASE}/addPolls`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Success', 'Poll created successfully!');
        setShowCreateModal(false);
        setNewPoll({ title: '', poll_type: 'yes_no', expires_at: '' });
        setExpirationDays('7');
        fetchPolls();
      } else {
        Alert.alert('Error', 'Failed to create poll');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const deletePoll = async (pollId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/deletePoll/${pollId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        Alert.alert('Success', 'Poll deleted successfully');
        fetchPolls();
        setShowDeleteModal(false);
        setPollToDelete(null);
        if (selectedPoll === pollId) {
          setSelectedPoll(null);
          setPollResults([]);
          setShowAllResponses(false);
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to delete poll');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred: ' + error.message);
    }
  };

  const expirePoll = async (pollId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/expirePoll/${pollId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_at: new Date().toISOString().slice(0, 19).replace('T', ' ') })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        Alert.alert('Success', 'Poll set to expired');
        fetchPolls();
      } else {
        Alert.alert('Error', data.error || 'Failed to expire poll');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred: ' + error.message);
    }
  };

  const confirmDelete = (poll) => {
    setPollToDelete(poll);
    setShowDeleteModal(true);
  };

  const fetchPollResults = async (pollId) => {
    if (selectedPoll === pollId) {
      setSelectedPoll(null);
      setPollResults([]);
      setShowAllResponses(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/getPollResponse/${pollId}/`);
      const data = await response.json();
      
      if (data.error || !Array.isArray(data)) {
        setPollResults([]);
        Alert.alert('Error', data.error || 'Invalid response format');
      } else {
        setPollResults(data);
      }
      setSelectedPoll(pollId);
      setShowAllResponses(false);
    } catch (error) {
      setPollResults([]);
      Alert.alert('Error', 'Failed to fetch poll results');
    }
  };

  const processChartData = () => {
    if (!pollResults || pollResults.length === 0) return null;

    const currentPoll = polls.find(poll => poll.id === selectedPoll);
    if (!currentPoll) return null;

    const answerCounts = {};
    pollResults.forEach(result => {
      const answer = result.answer || 'No Answer';
      answerCounts[answer] = (answerCounts[answer] || 0) + 1;
    });

    const pieData = Object.entries(answerCounts).map(([answer, count], index) => ({
      name: answer,
      population: count,
      color: getColor(index),
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    }));

    return { pieData, answerCounts, pollType: currentPoll.poll_type };
  };

  const getColor = (index) => {
    const colors = ['#007AFF', 'rgb(30,30,30)', 'rgb(228, 78, 78)', 'rgb(209, 209, 209)', 'rgb(97, 0, 0)','rgb(0, 24, 97)', 'rgb(36, 14, 198)', 'rgb(124, 124, 124)' ];
    return colors[index % colors.length];
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const renderPollTypeSelector = () => (
    <View style={styles.pollTypeContainer}>
      <Text style={styles.label}>Poll Type:</Text>
      {['yes_no', 'yes_no_maybe', 'short_answer'].map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.pollTypeOption,
            newPoll.poll_type === type && styles.selectedPollType
          ]}
          onPress={() => setNewPoll({ ...newPoll, poll_type: type })}
        >
          <Text style={[
            styles.pollTypeText,
            newPoll.poll_type === type && styles.selectedPollTypeText
          ]}>
            {type.replace('_', ' ').toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderResults = () => {
    if (!selectedPoll || !Array.isArray(pollResults) || pollResults.length === 0) {
      return <Text style={styles.noResults}>No responses yet</Text>;
    }

    const chartData = processChartData();
    if (!chartData) return <Text style={styles.noResults}>Unable to process chart data</Text>;

    const { pieData, answerCounts, pollType } = chartData;
    const visibleResults = showAllResponses ? pollResults : pollResults.slice(0, 5);
    const isLargeScreen = screenWidth > 900;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Poll Results ({pollResults.length} responses)</Text>
        
        <View style={[styles.mainContentWrapper, isLargeScreen && styles.mainContentWrapperLarge]}>
          <View style={[styles.chartSection, isLargeScreen && styles.chartSectionLarge]}>
            {((pollType === 'yes_no' || pollType === 'yes_no_maybe') && Object.keys(answerCounts).length <= 6) || 
             (pollType === 'short_answer' && Object.keys(answerCounts).length <= 10) ? (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}></Text>
                <PieChart
                  data={pieData}
                  width={isLargeScreen ? Math.min(screenWidth * 0.35, 380) : screenWidth - 60}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            ) : null}

            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Summary</Text>
              {Object.entries(answerCounts).map(([answer, count]) => (
                <View key={answer} style={styles.summaryItem}>
                  <Text style={styles.summaryAnswer}>{answer}</Text>
                  <Text style={styles.summaryCount}>
                    {count} ({((count / pollResults.length) * 100).toFixed(1)}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>

          
          <View style={[styles.responsesSection, isLargeScreen && styles.responsesSectionLarge]}>
            <Text style={styles.responsesTitle}>
              {pollType === 'short_answer' ? 'All Responses' : 'Individual Responses'}
            </Text>
            
            {visibleResults.map((result, index) => (
              <View key={result.id} style={[
                styles.resultItem,
                pollType === 'short_answer' && styles.shortAnswerCard
              ]}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultNumber}>#{index + 1}</Text>
                  
                  <Text style={styles.resultDate}>
                    {new Date(result.created_at).toLocaleString()}
                  </Text>
                </View>
                <Text style={[
                  styles.resultAnswer,
                  pollType === 'short_answer' && styles.shortAnswerText
                ]}>
                  {pollType === 'short_answer' ? (result.text_response || result.answer) : result.answer}
                </Text>
                {pollType === 'short_answer' && result.answer && (
                    <Text style={styles.categoryBadge}>{result.answer}</Text>
                  )}
              </View>
            ))}
            {pollResults.length > 5 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllResponses(!showAllResponses)}
              >
                <Text style={styles.showMoreText}>
                  {showAllResponses ? 'Show Less' : `Show More (${pollResults.length - 5} more)`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPollCard = ({ item: poll }) => (
    <View style={styles.pollCard}>
      <View style={styles.pollCardHeader}>
        <View style={styles.pollInfo}>
          <Text style={styles.pollTitle} numberOfLines={2} >
            {poll.title}
          </Text>
          <Text style={styles.pollType}>Type: {poll.poll_type}</Text>
          <Text style={styles.pollDate}>
            Created: {new Date(poll.created_at).toLocaleDateString()}
          </Text>
          {poll.expires_at && (
            <Text style={[
              styles.pollExpiry,
              isExpired(poll.expires_at) && styles.expiredText
            ]}>
              {isExpired(poll.expires_at) ? 'Expired: ' : 'Expires: '}
              {new Date(poll.expires_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.pollActions}>
        <TouchableOpacity
          style={[
            styles.viewResultsButton,
            selectedPoll === poll.id && styles.hideResultsButton
          ]}
          onPress={() => fetchPollResults(poll.id)}
        >
          <Text style={styles.viewResultsText}>
            {selectedPoll === poll.id ? 'Hide Results' : 'View Results'}
          </Text>
        </TouchableOpacity>

        {!isExpired(poll.expires_at) && (
          <TouchableOpacity
            style={styles.expireButton}
            onPress={() => expirePoll(poll.id)}
          >
            <Text style={styles.expireButtonText}>Set Expired</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => confirmDelete(poll)}
        >
          <Trash2 size={14} color="#ff4444" />
          <Text style={[styles.actionButtonText, { color: '#ff4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Polls</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create Poll</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={polls}
        renderItem={renderPollCard}
        keyExtractor={(item) => item.id.toString()}
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.pollList}
      />

      <View style={styles.resultsArea}>
        {selectedPoll ? (
          renderResults()
        ) : (
          <Text style={styles.noResults}>No poll selected to show results</Text>
        )}
      </View>

     
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.createModalOverlay}>
          <View style={styles.createModalContent}>
            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>Create New Poll</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.createCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.createModalBody}>
              <Text style={styles.label}>Poll Title:</Text>
              <TextInput
                style={styles.input}
                value={newPoll.title}
                onChangeText={(text) => setNewPoll({ ...newPoll, title: text })}
                placeholder="Enter poll question..."
                multiline
              />

              <Text style={styles.label}>Poll Type:</Text>
              <View style={styles.pollTypeContainer}>
                {['yes_no', 'yes_no_maybe', 'short_answer'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pollTypeOption,
                      newPoll.poll_type === type && styles.selectedPollType
                    ]}
                    onPress={() => setNewPoll({ ...newPoll, poll_type: type })}
                  >
                    <Text style={[
                      styles.pollTypeText,
                      newPoll.poll_type === type && styles.selectedPollTypeText
                    ]}>
                      {type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Expires In (days):</Text>
              <Text style={styles.helperText}>Leave empty for no expiration</Text>
              <View style={styles.expirationSelector}>
                {['3', '7', '14', '30'].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dayOption,
                      expirationDays === days && styles.selectedDayOption
                    ]}
                    onPress={() => setExpirationDays(days)}
                  >
                    <Text style={[
                      styles.dayOptionText,
                      expirationDays === days && styles.selectedDayOptionText
                    ]}>
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.dayOption,
                    expirationDays === '' && styles.selectedDayOption
                  ]}
                  onPress={() => setExpirationDays('')}
                >
                  <Text style={[
                    styles.dayOptionText,
                    expirationDays === '' && styles.selectedDayOptionText
                  ]}>
                    None
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={createPoll}>
                <Text style={styles.submitButtonText}>Create Poll</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Poll?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{pollToDelete?.title}"? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setPollToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={() => deletePoll(pollToDelete.id)}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
    margin: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'left',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  createButton: {
    backgroundColor: 'rgb(30,30,30)',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pollList: {
    padding: 16,
  },
  pollCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginRight:16,
    width: 400, 
  },
  pollCardHeader: {
    marginBottom: 12,
  },
  
  pollTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  pollType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pollDate: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  pollExpiry: {
    fontSize: 10,
    color: '#999',
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
  expiredText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  pollActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  viewResultsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  hideResultsButton: {
    backgroundColor: 'rgb(30, 30, 30)',
    color: 'rgb(169, 167, 167)',
  },
  viewResultsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  expireButton: {
    backgroundColor: 'rgb(241, 241, 241)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  expireButtonText: {
    color: 'rgb(142, 142, 142)',
    fontWeight: '',
    fontSize: 12,
  },
  resultsArea: {
    padding: 16,
  },
  resultsContainer: {
    padding: 16,
    maxHeight: '100%',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  mainContentWrapper: {
    flexDirection: 'column',
  },
  mainContentWrapperLarge: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartSectionLarge: {
    flex: 1,
    marginBottom: 0,
    minWidth: 380,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summarySection: {
    marginBottom: 24,
    paddingTop: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryAnswer: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  responsesSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  responsesSectionLarge: {
    flex: 1,
    borderTopWidth: 0,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    paddingTop: 0,
    paddingLeft: 32,
    minWidth: 380,
  },
  responsesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shortAnswerCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  
    borderBottomWidth: 0,
  },
  showMoreButton:{
    backgroundColor: "rgb(30,30,30)",
    color:'white',
    paddingHorizontal: 10,
    paddingVertical:7,
    maxWidth: 175,
    borderRadius: 8
  },
  showMoreText:{
    color: 'white'
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  resultAnswer: {
    fontSize: 12,
    color: '#333',
  },
  shortAnswerText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    color: '#222',
  },
  shortAnswerNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6,
  },
  resultDate: {
    fontSize: 10,
    color: '#999',
  },
  categoryBadge: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    margin: 7,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '',
    maxWidth: 150,
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
    fontSize: 16,
  },
  createModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createCloseButton: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300',
  },
  createModalBody: {
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    fontSize: 14,
  },
  pollTypeContainer: {
    marginBottom: 16,
  },
  pollTypeOption: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  selectedPollType: {
    backgroundColor: 'rgb(30,30,30)',
    borderColor: 'rgb(30,30,30)',
  },
  pollTypeText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  selectedPollTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  expirationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayOption: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedDayOption: {
    backgroundColor: 'rgb(30,30,30)',
    borderColor: 'rgb(30,30,30)',
  },
  dayOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  selectedDayOptionText: {
    color: '#fff',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmDeleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButtonText:{
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  submitButton: {
    backgroundColor: 'rgb(30,30,30)',
    padding: 16
  }})
export default AdminPage;