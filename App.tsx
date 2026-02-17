import React, { useState, useEffect, useCallback } from 'react';
import { Page, User, ActivityLog } from './types';
import Sidebar from './components/Sidebar';
import AuthGate from './components/AuthGate';
import TopNav from './components/TopNav';
import AnimePage from './pages/AnimePage';
import FaithPage from './pages/FaithPage';
import CodePage from './pages/CodePage';
import ChatPage from './pages/ChatPage';
import ToolsPage from './pages/ToolsPage';
import SpinPage from './pages/SpinPage';
import RankingPage from './pages/RankingPage';
import CreatorPage from './pages/CreatorPage';
import SecurityPage from './pages/SecurityPage';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>(Page.ANIME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);

  // نظام التنبيهات الملكي (Toast)
  const showToast = useCallback((message: string, color: string = '#ffd700') => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // مراقبة حالة المستخدم والبيانات من Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as User);
          }
        });
        return () => unsubDoc();
      } else {
        setUser(null);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  // تحديث النقاط (Points)
  const updatePoints = async (amount: number) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      points: Math.max(0, (user.points || 0) + amount)
    });
  };

  // إضافة خبرة (XP) وتطوير المستوى
  const addXP = async (amount: number) => {
    if (!user) return;
    const newXP = (user.xp || 0) + amount;
    const nextLevelXP = user.level * 1000;
    const updates: any = { xp: newXP };
    
    if (newXP >= nextLevelXP) {
      updates.level = user.level + 1;
      updates.xp = newXP - nextLevelXP;
      showToast(`مبروك! ارتفع مستواك إلى لفل ${user.level + 1} 👑`, '#00ffff');
    }
    
    await updateDoc(doc(db, "users", user.uid), updates);
  };

  // تفعيل/إلغاء وضع التخفي (Ghost Mode)
  const handleToggleGhost = async () => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { isGhostMode: !user.isGhostMode });
    showToast(user.isGhostMode ? 'تم إلغاء وضع التخفي' : 'أنت الآن في وضع التخفي الملكي 👻');
  };

  const handleLogout = () => signOut(auth);

  if (isInitializing) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <div className="orbitron text-yellow-500 text-2xl animate-pulse mb-4 font-black">SULTAN EMPIRE LOADING...</div>
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500 animate-[loading_2s_infinite_linear]"></div>
        </div>
      </div>
    );
  }

  // إذا لم يسجل دخول، تظهر بوابة الحماية
  if (!user) return <AuthGate onLogin={(u) => setUser(u)} />;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* التنقل العلوي */}
      <TopNav user={user} onMenuClick={() => setIsSidebarOpen(true)} />

      {/* القائمة الجانبية */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* المحتوى الرئيسي للإمبراطورية */}
      <main className="pt-24 px-4 md:px-12 pb-12 transition-all duration-500">
        <div className="max-w-7xl mx-auto">
          {currentPage === Page.ANIME && <AnimePage updatePoints={updatePoints} toast={showToast} />}
          {currentPage === Page.FAITH && <FaithPage user={user} toast={showToast} />}
          {currentPage === Page.CODE && <CodePage user={user} toast={showToast} />}
          {currentPage === Page.CHAT && <ChatPage user={user} toast={showToast} />}
          {currentPage === Page.TOOLS && <ToolsPage user={user} toast={showToast} addXP={addXP} />}
          {currentPage === Page.SPIN && <SpinPage user={user} updatePoints={updatePoints} toast={showToast} />}
          {currentPage === Page.RANKING && <RankingPage />}
          {currentPage === Page.CREATOR && <CreatorPage user={user} toast={showToast} />}
          {currentPage === Page.SECURITY && <SecurityPage user={user} logs={logs} onToggleGhost={handleToggleGhost} toast={showToast} />}
        </div>
      </main>

      {/* نظام التنبيهات العائم */}
      {toast && (
        <div 
          className="fixed bottom-8 right-8 z-[10000] px-8 py-4 rounded-2xl font-black shadow-2xl animate-bounce text-center border border-black/10" 
          style={{ backgroundColor: toast.color, color: '#000' }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;
