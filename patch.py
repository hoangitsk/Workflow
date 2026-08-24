import re

with open('src/app/components/ClientApp.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. UserAvatar component
avatar_code = '''
function UserAvatar({ name, size = 22, className = '' }: { name: string, size?: number, className?: string }) {
  if (!name) return null;
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [C.teal, C.amber, C.red, C.violet, C.blue, C.green];
  const color = colors[hash % colors.length];
  return (
    <div className={className} style={{ width: size, height: size, borderRadius: '50%', background: color + '33', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, fontWeight: 'bold' }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}
'''
if 'function UserAvatar' not in content:
    content = content.replace('/* ---------------------------------------------------------------------', avatar_code + '\n/* ---------------------------------------------------------------------', 1)

# replace instances of {actor.name[0]} with UserAvatar in header
regex_actor_avatar = r'<div style=\{\{\s*width:\s*22,\s*height:\s*22,\s*borderRadius:\s*11,\s*background:\s*C\.tealDim.*?>\s*\{actor\.name\[0\]\}\s*</div>'
content = re.sub(regex_actor_avatar, '<UserAvatar name={actor.name} />', content, flags=re.DOTALL)

# 2. Click outside for notification flyout
if 'const notificationsRef =' not in content:
    content = content.replace('const [showNotificationsFlyout, setShowNotificationsFlyout] = useState(false);', '''const [showNotificationsFlyout, setShowNotificationsFlyout] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsFlyout(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);''')
    content = content.replace('<div className="relative">', '<div className="relative" ref={notificationsRef}>', 1)

# 3. Keyboard shortcuts
if 'const handleKeyDown =' not in content:
    shortcuts = '''
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNewIdea(false);
        setApproveIdeaTarget(null);
        setQaCompleteIdeaTarget(null);
        setQaRejectIdeaTarget(null);
        setSchedulePostTarget(null);
        setCancelIdeaTarget(null);
        setShowNewChannel(false);
        setShowNewPlatform(false);
        setShowNewMember(false);
        setShowSettingsModal(false);
        setConfirmDeleteChannel(null);
        setShowProfile(null);
        setEditProfile(null);
        setShowNotificationsFlyout(false);
        setShowChangePassword(false);
        setSubmitScriptTarget(null);
        setSubmitVideoTarget(null);
        setReassignIdeaTarget(null);
        setEditIdeaTarget(null);
        setExtendDeadlineTarget(null);
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowNewIdea(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
'''
    content = content.replace('  const router = useRouter();', shortcuts + '\n  const router = useRouter();')

# 4. Confirm delete member
content = content.replace('onRemoveMember={(m) => runAction(removeMemberAction, m.id)}', 'onRemoveMember={(m) => { if (window.confirm("Bạn có chắc muốn xoá thành viên " + m.name + "?")) runAction(removeMemberAction, m.id); }}')

with open('src/app/components/ClientApp.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched ClientApp.tsx successfully')
