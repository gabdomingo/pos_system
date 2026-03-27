import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF3FB'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    paddingVertical: 24,
    gap: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 920
  },
  hero: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: '#102744',
    gap: 10
  },
  kicker: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  heroTitle: {
    marginTop: 2,
    color: '#F8FAFC',
    fontWeight: '700'
  },
  heroCopy: {
    color: '#D8E4F7',
    lineHeight: 22
  },
  tagRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  tagText: {
    color: '#EFF6FF',
    fontSize: 12,
    fontWeight: '700'
  },
  showcaseGrid: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10
  },
  showcaseCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  showcaseCardWide: {
    width: '48.8%'
  },
  showcaseLabel: {
    color: 'rgba(196,220,255,0.82)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase'
  },
  showcaseCopy: {
    marginTop: 6,
    color: '#F8FAFC',
    lineHeight: 20,
    fontWeight: '700'
  },
  card: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF'
  },
  cardWide: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 760
  },
  cardTopline: {
    color: '#0B5ED7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase'
  },
  cardTitle: {
    marginTop: 8,
    color: '#0F172A',
    fontWeight: '700'
  },
  cardSubtitle: {
    marginTop: 6,
    color: '#475467',
    lineHeight: 20
  },
  roleBanner: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(11,94,215,0.12)',
    backgroundColor: '#EEF5FF'
  },
  roleBannerLabel: {
    color: '#0B5ED7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  roleBannerTitle: {
    marginTop: 4,
    color: '#101828',
    fontWeight: '700'
  },
  roleBannerCopy: {
    marginTop: 4,
    color: '#475467',
    lineHeight: 20
  },
  roleGrid: {
    marginTop: 16,
    marginBottom: 16,
    gap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  roleCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E2F0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  roleCardActive: {
    borderColor: '#0B5ED7',
    backgroundColor: '#EAF3FF'
  },
  roleCardWide: {
    width: '48.8%'
  },
  roleTitle: {
    color: '#101828',
    fontWeight: '700',
    marginBottom: 4
  },
  roleTitleActive: {
    color: '#0B5ED7'
  },
  roleCopy: {
    color: '#475467',
    lineHeight: 18
  },
  roleMeta: {
    marginTop: 6,
    color: '#0B5ED7',
    fontSize: 12,
    fontWeight: '700'
  },
  fieldGrid: {
    marginTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  fieldBlock: {
    width: '100%'
  },
  fieldBlockHalf: {
    width: '48.8%'
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF'
  },
  inlineNote: {
    marginTop: -4,
    marginBottom: 12,
    color: '#475467',
    lineHeight: 18,
    fontSize: 12
  },
  helperChips: {
    marginBottom: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  helperChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(11,94,215,0.12)',
    backgroundColor: '#EEF5FF'
  },
  helperChipText: {
    color: '#0B5ED7',
    fontSize: 12,
    fontWeight: '700'
  },
  roleHint: {
    marginBottom: 2,
    color: '#0B5ED7',
    fontWeight: '600'
  },
  roleHintMuted: {
    color: '#475467',
    lineHeight: 20
  },
  forgotPanel: {
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(11,94,215,0.12)',
    backgroundColor: '#F7FAFF',
  },
  forgotTitle: {
    color: '#101828',
    fontWeight: '700',
    marginBottom: 4
  },
  forgotCopy: {
    color: '#475467',
    lineHeight: 20,
    marginBottom: 12
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12
  },
  successText: {
    color: '#087443',
    lineHeight: 18,
    marginBottom: 10
  },
  errorText: {
    color: '#B42318',
    lineHeight: 18,
    marginBottom: 10
  },
  button: {
    marginTop: 10
  },
  buttonContent: {
    minHeight: 46
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  staffProvisionText: {
    color: '#475467',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 6
  }
});
