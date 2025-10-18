import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { Contract } from '../models/contract.interface';
import { 
  ContractCategory, 
  ContractTag, 
  ContractComment, 
  ContractAttachment,
  ContractReminder 
} from '../models/contract-enhancements.interface';
import { ContractEnhancementService } from '../services/contract-enhancement.service';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

interface ContractEnhancementsProps {
  visible: boolean;
  onClose: () => void;
  contract: Contract;
  onContractUpdated: () => void;
}

type TabType = 'category' | 'tags' | 'comments' | 'attachments' | 'reminders';

export function ContractEnhancements({
  visible,
  onClose,
  contract,
  onContractUpdated,
}: ContractEnhancementsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('category');
  const [categories, setCategories] = useState<ContractCategory[]>([]);
  const [tags, setTags] = useState<ContractTag[]>([]);
  const [comments, setComments] = useState<ContractComment[]>([]);
  const [attachments, setAttachments] = useState<ContractAttachment[]>([]);
  const [reminders, setReminders] = useState<ContractReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderMessage, setNewReminderMessage] = useState('');
  const [newReminderDate, setNewReminderDate] = useState(new Date());

  const tabs = [
    { id: 'category', name: 'Κατηγορία', icon: '📂' },
    { id: 'tags', name: 'Ετικέτες', icon: '🏷️' },
    { id: 'comments', name: 'Σχόλια', icon: '💬' },
    { id: 'attachments', name: 'Επισυναπτόμενα', icon: '📎' },
    { id: 'reminders', name: 'Υπενθυμίσεις', icon: '⏰' },
  ];

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  async function loadData() {
    try {
      setLoading(true);
      const [categoriesData, tagsData, commentsData, attachmentsData, remindersData] = await Promise.all([
        ContractEnhancementService.getAllCategories(),
        ContractEnhancementService.getAllTags(),
        ContractEnhancementService.getContractComments(contract.id),
        ContractEnhancementService.getContractAttachments(contract.id),
        ContractEnhancementService.getContractReminders(contract.id),
      ]);

      setCategories(categoriesData);
      setTags(tagsData);
      setComments(commentsData);
      setAttachments(attachmentsData);
      setReminders(remindersData);
    } catch (error) {
      console.error('Error loading enhancement data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης δεδομένων');
    } finally {
      setLoading(false);
    }
  }

  async function handleCategorySelect(categoryId: string) {
    try {
      await ContractEnhancementService.updateContractEnhancements(contract.id, {
        categoryId,
      });
      onContractUpdated();
      Alert.alert('Επιτυχία', 'Η κατηγορία ενημερώθηκε');
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης κατηγορίας');
    }
  }

  async function handleTagToggle(tagId: string) {
    try {
      const currentTags = contract.tags || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(id => id !== tagId)
        : [...currentTags, tagId];

      await ContractEnhancementService.updateContractEnhancements(contract.id, {
        tags: newTags,
      });
      onContractUpdated();
    } catch (error) {
      console.error('Error updating tags:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης ετικετών');
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε σχόλιο');
      return;
    }

    try {
      const comment = await ContractEnhancementService.addComment({
        contractId: contract.id,
        userId: 'current-user', // TODO: Get from auth
        userName: 'Current User', // TODO: Get from auth
        content: newComment.trim(),
        isInternal: isInternalComment,
      });

      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setIsInternalComment(false);
      Alert.alert('Επιτυχία', 'Το σχόλιο προστέθηκε');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία προσθήκης σχολίου');
    }
  }

  async function handleAddReminder() {
    if (!newReminderTitle.trim() || !newReminderMessage.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }

    try {
      const reminder = await ContractEnhancementService.createReminder({
        contractId: contract.id,
        type: 'custom',
        title: newReminderTitle.trim(),
        message: newReminderMessage.trim(),
        scheduledDate: newReminderDate,
        isActive: true,
        isSent: false,
      });

      setReminders(prev => [...prev, reminder]);
      setNewReminderTitle('');
      setNewReminderMessage('');
      setNewReminderDate(new Date());
      Alert.alert('Επιτυχία', 'Η υπενθύμιση δημιουργήθηκε');
    } catch (error) {
      console.error('Error adding reminder:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία δημιουργίας υπενθύμισης');
    }
  }

  function renderTabBar() {
    return (
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive
              ]}
              onPress={() => setActiveTab(tab.id as TabType)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  function renderCategoryTab() {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Επιλογή Κατηγορίας</Text>
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                contract.categoryId === item.id && styles.categoryItemSelected
              ]}
              onPress={() => handleCategorySelect(item.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                <Text style={styles.categoryIconText}>{item.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <Text style={styles.categoryDescription}>{item.description}</Text>
              </View>
              {contract.categoryId === item.id && (
                <Text style={styles.selectedIndicator}>✓</Text>
              )}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  function renderTagsTab() {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Ετικέτες</Text>
        <FlatList
          data={tags}
          renderItem={({ item }) => {
            const isSelected = contract.tags?.includes(item.id) || false;
            return (
              <TouchableOpacity
                style={[
                  styles.tagItem,
                  isSelected && styles.tagItemSelected
                ]}
                onPress={() => handleTagToggle(item.id)}
              >
                <View style={[styles.tagColor, { backgroundColor: item.color }]} />
                <Text style={[
                  styles.tagName,
                  isSelected && styles.tagNameSelected
                ]}>
                  {item.name}
                </Text>
                {item.description && (
                  <Text style={styles.tagDescription}>{item.description}</Text>
                )}
                {isSelected && (
                  <Text style={styles.selectedIndicator}>✓</Text>
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  function renderCommentsTab() {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Σχόλια</Text>
        
        {/* Add Comment Form */}
        <View style={styles.commentForm}>
          <TextInput
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Προσθέστε σχόλιο..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={3}
          />
          <View style={styles.commentOptions}>
            <TouchableOpacity
              style={[
                styles.internalToggle,
                isInternalComment && styles.internalToggleActive
              ]}
              onPress={() => setIsInternalComment(!isInternalComment)}
            >
              <Text style={[
                styles.internalToggleText,
                isInternalComment && styles.internalToggleTextActive
              ]}>
                Εσωτερικό
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addCommentButton}
              onPress={handleAddComment}
            >
              <Text style={styles.addCommentButtonText}>Προσθήκη</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments List */}
        <FlatList
          data={comments}
          renderItem={({ item }) => (
            <View style={[
              styles.commentItem,
              item.isInternal && styles.commentItemInternal
            ]}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{item.userName}</Text>
                <Text style={styles.commentDate}>
                  {new Date(item.createdAt).toLocaleDateString('el-GR')}
                </Text>
                {item.isInternal && (
                  <View style={styles.internalBadge}>
                    <Text style={styles.internalBadgeText}>Εσωτερικό</Text>
                  </View>
                )}
              </View>
              <Text style={styles.commentContent}>{item.content}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  function renderAttachmentsTab() {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Επισυναπτόμενα Αρχεία</Text>
        
        {attachments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📎</Text>
            <Text style={styles.emptyText}>Δεν υπάρχουν επισυναπτόμενα αρχεία</Text>
          </View>
        ) : (
          <FlatList
            data={attachments}
            renderItem={({ item }) => (
              <View style={styles.attachmentItem}>
                <View style={styles.attachmentIcon}>
                  <Text style={styles.attachmentIconText}>
                    {item.fileType === 'photo' ? '📷' : 
                     item.fileType === 'document' ? '📄' : '📎'}
                  </Text>
                </View>
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName}>{item.fileName}</Text>
                  <Text style={styles.attachmentSize}>
                    {(item.fileSize / 1024).toFixed(1)} KB
                  </Text>
                  {item.description && (
                    <Text style={styles.attachmentDescription}>{item.description}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.downloadButton}>
                  <Text style={styles.downloadButtonText}>⬇️</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }

  function renderRemindersTab() {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Υπενθυμίσεις</Text>
        
        {/* Add Reminder Form */}
        <View style={styles.reminderForm}>
          <TextInput
            style={styles.reminderInput}
            value={newReminderTitle}
            onChangeText={setNewReminderTitle}
            placeholder="Τίτλος υπενθύμισης..."
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={[styles.reminderInput, styles.reminderMessageInput]}
            value={newReminderMessage}
            onChangeText={setNewReminderMessage}
            placeholder="Μήνυμα..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.addReminderButton}
            onPress={handleAddReminder}
          >
            <Text style={styles.addReminderButtonText}>Προσθήκη Υπενθύμισης</Text>
          </TouchableOpacity>
        </View>

        {/* Reminders List */}
        <FlatList
          data={reminders}
          renderItem={({ item }) => (
            <View style={styles.reminderItem}>
              <View style={styles.reminderHeader}>
                <Text style={styles.reminderTitle}>{item.title}</Text>
                <Text style={styles.reminderDate}>
                  {new Date(item.scheduledDate).toLocaleDateString('el-GR')}
                </Text>
              </View>
              <Text style={styles.reminderMessage}>{item.message}</Text>
              <View style={styles.reminderStatus}>
                <Text style={[
                  styles.reminderStatusText,
                  item.isActive ? styles.reminderStatusActive : styles.reminderStatusInactive
                ]}>
                  {item.isActive ? 'Ενεργή' : 'Ανενεργή'}
                </Text>
                {item.isSent && (
                  <Text style={styles.reminderSentText}>Απεστάλη</Text>
                )}
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'category':
        return renderCategoryTab();
      case 'tags':
        return renderTagsTab();
      case 'comments':
        return renderCommentsTab();
      case 'attachments':
        return renderAttachmentsTab();
      case 'reminders':
        return renderRemindersTab();
      default:
        return null;
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ενισχύσεις Συμβολαίου</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Contract Info */}
        <View style={styles.contractInfo}>
          <Text style={styles.contractName}>{contract.renterInfo.fullName}</Text>
          <Text style={styles.contractCar}>
            {contract.carInfo.makeModel} • {contract.carInfo.licensePlate}
          </Text>
        </View>

        {/* Tab Bar */}
        {renderTabBar()}

        {/* Tab Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderTabContent()}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '600',
  },
  placeholder: {
    width: 30,
  },
  contractInfo: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  contractName: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  contractCar: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  tabBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  tabText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  categoryItemSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryIconText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  selectedIndicator: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  tagItemSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  tagColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  tagName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  tagNameSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tagDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  commentForm: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  commentInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  commentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  internalToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  internalToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  internalToggleText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
  },
  internalToggleTextActive: {
    color: '#FFFFFF',
  },
  addCommentButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  addCommentButtonText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  commentItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  commentItemInternal: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  commentAuthor: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  commentDate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  internalBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  internalBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  commentContent: {
    ...Typography.bodyMedium,
    color: Colors.text,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  attachmentIconText: {
    fontSize: 18,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentSize: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  attachmentDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  downloadButton: {
    padding: Spacing.sm,
  },
  downloadButtonText: {
    fontSize: 18,
  },
  reminderForm: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  reminderInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  reminderMessageInput: {
    height: 80,
  },
  addReminderButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  addReminderButtonText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reminderItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reminderTitle: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  reminderDate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  reminderMessage: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  reminderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderStatusText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    marginRight: Spacing.sm,
  },
  reminderStatusActive: {
    color: Colors.success,
  },
  reminderStatusInactive: {
    color: Colors.textSecondary,
  },
  reminderSentText: {
    ...Typography.bodySmall,
    color: Colors.info,
    fontWeight: '500',
  },
});
