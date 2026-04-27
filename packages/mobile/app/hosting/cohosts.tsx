import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, Mail, Trash2, RotateCcw, Check, X } from 'lucide-react-native';
import { cohostsApi, propertiesApi, CoHostInvite } from '@/lib/api';

type Tab = 'invites' | 'manage';

const ROLES = [
  { value: 'co_host', label: 'Co-Host' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'assistant', label: 'Assistant' },
];

function statusColor(status: string) {
  if (status === 'accepted') return '#10b981';
  if (status === 'declined') return '#ef4444';
  return '#f59e0b';
}

export default function CohostsScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('invites');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('co_host');
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Guest side: incoming invitations
  const { data: myInvites = [], isLoading: loadingInvites } = useQuery<CoHostInvite[]>({
    queryKey: ['my-cohost-invites'],
    queryFn: cohostsApi.getMyInvites,
  });

  // Host side: properties list
  const { data: propertiesData } = useQuery({
    queryKey: ['host-listings'],
    queryFn: propertiesApi.getHostListings,
  });
  const properties: any[] = propertiesData?.items ?? propertiesData ?? [];

  // Host side: co-hosts for selected property
  const { data: cohosts = [], isLoading: loadingCohosts } = useQuery<CoHostInvite[]>({
    queryKey: ['cohosts', selectedPropertyId],
    queryFn: () => cohostsApi.getCohosts(selectedPropertyId!),
    enabled: !!selectedPropertyId,
  });

  const respondMut = useMutation({
    mutationFn: ({ id, accept }: { id: number; accept: boolean }) =>
      cohostsApi.respond(id, accept),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-cohost-invites'] }),
    onError: () => Alert.alert('Error', 'Failed to respond to invite'),
  });

  const inviteMut = useMutation({
    mutationFn: () => cohostsApi.invite(selectedPropertyId!, inviteEmail.trim(), inviteRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cohosts', selectedPropertyId] });
      setInviteEmail('');
      setShowInviteForm(false);
    },
    onError: () => Alert.alert('Error', 'Failed to send invite. Check the email address.'),
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => cohostsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cohosts', selectedPropertyId] }),
    onError: () => Alert.alert('Error', 'Failed to remove co-host'),
  });

  const reinviteMut = useMutation({
    mutationFn: (id: number) => cohostsApi.reinvite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cohosts', selectedPropertyId] }),
    onError: () => Alert.alert('Error', 'Failed to reinvite'),
  });

  function confirmRemove(id: number, name: string) {
    Alert.alert('Remove Co-Host', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMut.mutate(id) },
    ]);
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Co-Hosts</Text>
      </View>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tab, tab === 'invites' && s.tabActive]}
          onPress={() => setTab('invites')}
        >
          <Text style={[s.tabText, tab === 'invites' && s.tabTextActive]}>
            My Invites {myInvites.filter((i) => i.status === 'pending').length > 0
              ? `(${myInvites.filter((i) => i.status === 'pending').length})`
              : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'manage' && s.tabActive]}
          onPress={() => setTab('manage')}
        >
          <Text style={[s.tabText, tab === 'manage' && s.tabTextActive]}>Manage</Text>
        </TouchableOpacity>
      </View>

      {tab === 'invites' && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
          {loadingInvites ? (
            <ActivityIndicator style={{ marginTop: 32 }} color="#6366f1" />
          ) : myInvites.length === 0 ? (
            <View style={s.empty}>
              <Mail color="#d1d5db" size={40} />
              <Text style={s.emptyText}>No co-host invitations</Text>
              <Text style={s.emptySubText}>When hosts invite you as a co-host, they&apos;ll appear here.</Text>
            </View>
          ) : (
            myInvites.map((invite) => (
              <View key={invite.id} style={s.card}>
                <View style={s.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{invite.property?.title ?? `Property #${invite.propertyId}`}</Text>
                    <Text style={s.cardSub}>Role: {invite.role.replace(/_/g, ' ')}</Text>
                    {invite.inviter && (
                      <Text style={s.cardSub}>
                        From: {invite.inviter.firstName} {invite.inviter.lastName}
                      </Text>
                    )}
                  </View>
                  <Text style={[s.statusBadge, { color: statusColor(invite.status) }]}>
                    {invite.status}
                  </Text>
                </View>
                {invite.status === 'pending' && (
                  <View style={s.actionRow}>
                    <TouchableOpacity
                      style={[s.actionBtn, s.acceptBtn]}
                      onPress={() => respondMut.mutate({ id: invite.id, accept: true })}
                      disabled={respondMut.isPending}
                    >
                      <Check size={14} color="#fff" />
                      <Text style={s.actionBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, s.declineBtn]}
                      onPress={() => respondMut.mutate({ id: invite.id, accept: false })}
                      disabled={respondMut.isPending}
                    >
                      <X size={14} color="#fff" />
                      <Text style={s.actionBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {tab === 'manage' && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
          {/* Property picker */}
          <Text style={s.sectionLabel}>Select Property</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {properties.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={[s.propChip, selectedPropertyId === p.id && s.propChipActive]}
                onPress={() => { setSelectedPropertyId(p.id); setShowInviteForm(false); }}
              >
                <Text
                  style={[s.propChipText, selectedPropertyId === p.id && s.propChipTextActive]}
                  numberOfLines={1}
                >
                  {p.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {!selectedPropertyId ? (
            <View style={s.empty}>
              <Users color="#d1d5db" size={40} />
              <Text style={s.emptyText}>Select a property</Text>
            </View>
          ) : (
            <>
              {loadingCohosts ? (
                <ActivityIndicator color="#6366f1" />
              ) : cohosts.length === 0 ? (
                <View style={s.empty}>
                  <Users color="#d1d5db" size={32} />
                  <Text style={s.emptyText}>No co-hosts yet</Text>
                </View>
              ) : (
                cohosts.map((ch) => (
                  <View key={ch.id} style={s.card}>
                    <View style={s.cardRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle}>{(ch as any).inviteeEmail ?? (ch as any).email ?? `Co-host #${ch.id}`}</Text>
                        <Text style={s.cardSub}>Role: {ch.role.replace(/_/g, ' ')}</Text>
                        <Text style={[s.statusBadge, { color: statusColor(ch.status) }]}>{ch.status}</Text>
                      </View>
                      <View style={s.iconActions}>
                        {ch.status === 'declined' && (
                          <TouchableOpacity onPress={() => reinviteMut.mutate(ch.id)} style={s.iconBtn}>
                            <RotateCcw size={18} color="#6366f1" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => confirmRemove(ch.id, (ch as any).inviteeEmail ?? `Co-host #${ch.id}`)}
                          style={s.iconBtn}
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}

              {/* Invite form toggle */}
              {!showInviteForm ? (
                <TouchableOpacity style={s.inviteToggle} onPress={() => setShowInviteForm(true)}>
                  <UserPlus size={16} color="#6366f1" />
                  <Text style={s.inviteToggleText}>Invite a co-host</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.inviteForm}>
                  <Text style={s.inviteFormTitle}>Invite Co-Host</Text>
                  <TextInput
                    style={s.input}
                    placeholder="Email address"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                  />
                  <Text style={s.roleLabel}>Role</Text>
                  <View style={s.roleRow}>
                    {ROLES.map((r) => (
                      <TouchableOpacity
                        key={r.value}
                        style={[s.roleChip, inviteRole === r.value && s.roleChipActive]}
                        onPress={() => setInviteRole(r.value)}
                      >
                        <Text style={[s.roleChipText, inviteRole === r.value && s.roleChipTextActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={s.actionRow}>
                    <TouchableOpacity
                      style={[s.actionBtn, s.acceptBtn, { flex: 1 }]}
                      onPress={() => inviteMut.mutate()}
                      disabled={!inviteEmail.trim() || inviteMut.isPending}
                    >
                      {inviteMut.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={s.actionBtnText}>Send Invite</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, s.declineBtn]}
                      onPress={() => { setShowInviteForm(false); setInviteEmail(''); }}
                    >
                      <Text style={s.actionBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#6366f1' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#6366f1' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardSub: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  statusBadge: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  acceptBtn: { backgroundColor: '#10b981' },
  declineBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  iconActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  iconBtn: { padding: 6 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  propChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  propChipActive: { backgroundColor: '#ede9fe', borderColor: '#6366f1' },
  propChipText: { fontSize: 13, color: '#374151', maxWidth: 140 },
  propChipTextActive: { color: '#6366f1', fontWeight: '600' },
  inviteToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#c4b5fd', borderStyle: 'dashed', borderRadius: 10, padding: 14, marginTop: 8, justifyContent: 'center' },
  inviteToggleText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  inviteForm: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  inviteFormTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb', marginBottom: 10 },
  roleLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  roleChipActive: { borderColor: '#6366f1', backgroundColor: '#ede9fe' },
  roleChipText: { fontSize: 12, color: '#374151' },
  roleChipTextActive: { color: '#6366f1', fontWeight: '600' },
});
