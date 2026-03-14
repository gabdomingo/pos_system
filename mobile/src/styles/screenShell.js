import { StyleSheet } from 'react-native';

export const screenShell = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F8'
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 28
  },
  listContent: {
    gap: 12,
    paddingBottom: 28
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: '#163567'
  },
  heroEyebrow: {
    color: '#BFD4FF',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 12
  },
  heroTitle: {
    marginTop: 6,
    color: '#FFFFFF'
  },
  heroCopy: {
    marginTop: 8,
    color: '#D9E5FF',
    lineHeight: 20
  },
  sectionCard: {
    borderRadius: 22
  },
  sectionCardSoft: {
    borderRadius: 22,
    backgroundColor: '#F8FAFE'
  },
  errorText: {
    color: '#B42318'
  },
  metaText: {
    color: '#667085'
  },
  emptyText: {
    textAlign: 'center',
    color: '#667085',
    marginTop: 12
  }
});
