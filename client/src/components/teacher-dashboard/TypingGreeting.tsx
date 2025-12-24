import React, { useState, useEffect, useCallback, useRef } from 'react';

interface TypingGreetingProps {
    teacherName: string;
}

// 응원/감사 메시지 카피셋
const GREETING_MESSAGES = [
    "오늘도 아이들 곁에 계시네요.",
    "함께 걷는 길, 든든합니다.",
    "조용한 수고, 알고 있어요.",
    "오늘 하루도 좋은 씨앗이에요.",
    "선생님의 하루가 평안하길요.",
    "늘 그 자리에 계셔서 감사해요.",
    "한 걸음씩, 함께 가고 있어요.",
    "아이들이 선생님을 기다려요.",
    "오늘도 좋은 하루 되셨으면요.",
    "그 마음이 참 귀해요.",
    "선생님이 있어 든든해요.",
    "작은 수고가 큰 사랑이에요.",
];

type TypingState = 'idle' | 'typing-name' | 'paused' | 'typing-message' | 'cursor-blink' | 'complete';

const SESSION_KEY = 'greeting_animation_played';

export const TypingGreeting = ({ teacherName }: TypingGreetingProps) => {
    const [state, setState] = useState<TypingState>('idle');
    const [displayedName, setDisplayedName] = useState('');
    const [displayedMessage, setDisplayedMessage] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState('');

    const fullName = `${teacherName} 선생님,`;
    const animationPlayedRef = useRef(false);

    // 세션 체크 및 메시지 선택
    useEffect(() => {
        const alreadyPlayed = sessionStorage.getItem(SESSION_KEY);

        if (alreadyPlayed) {
            // 이미 재생됨 - 완성된 상태로 고정
            const savedMessage = sessionStorage.getItem('greeting_message') || GREETING_MESSAGES[0];
            setDisplayedName(fullName);
            setDisplayedMessage(savedMessage);
            setSelectedMessage(savedMessage);
            setState('complete');
            setShowCursor(false);
        } else {
            // 랜덤 메시지 선택
            const randomIndex = Math.floor(Math.random() * GREETING_MESSAGES.length);
            const message = GREETING_MESSAGES[randomIndex];
            setSelectedMessage(message);
            sessionStorage.setItem('greeting_message', message);

            // 0.5초 후 타이핑 시작
            const timer = setTimeout(() => {
                setState('typing-name');
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [fullName]);

    // 이름 타이핑
    useEffect(() => {
        if (state !== 'typing-name') return;

        let charIndex = 0;
        const interval = setInterval(() => {
            if (charIndex < fullName.length) {
                setDisplayedName(fullName.slice(0, charIndex + 1));
                charIndex++;
            } else {
                clearInterval(interval);
                // 0.7초 정지 후 메시지 타이핑 시작
                setTimeout(() => {
                    setState('typing-message');
                }, 700);
            }
        }, 60 + Math.random() * 40); // 60~100ms 랜덤 간격

        return () => clearInterval(interval);
    }, [state, fullName]);

    // 메시지 타이핑
    useEffect(() => {
        if (state !== 'typing-message') return;

        let charIndex = 0;
        const interval = setInterval(() => {
            if (charIndex < selectedMessage.length) {
                setDisplayedMessage(selectedMessage.slice(0, charIndex + 1));
                charIndex++;
            } else {
                clearInterval(interval);
                setState('cursor-blink');

                // 2초 커서 깜빡임 후 완료
                setTimeout(() => {
                    setState('complete');
                    setShowCursor(false);
                    sessionStorage.setItem(SESSION_KEY, 'true');
                }, 2000);
            }
        }, 50 + Math.random() * 30); // 50~80ms 랜덤 간격

        return () => clearInterval(interval);
    }, [state, selectedMessage]);

    // 커서 깜빡임 애니메이션
    useEffect(() => {
        if (state === 'complete') return;

        const blinkInterval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 530);

        return () => clearInterval(blinkInterval);
    }, [state]);

    const styles = {
        container: {
            minHeight: 72,
        } as React.CSSProperties,
        nameRow: {
            fontSize: 28,
            fontWeight: 800,
            color: '#191F28',
            lineHeight: 1.35,
            margin: 0,
            letterSpacing: -0.5,
            display: 'flex',
            alignItems: 'baseline',
        } as React.CSSProperties,
        messageRow: {
            fontSize: 22,
            fontWeight: 500,
            color: '#6B7684',
            lineHeight: 1.4,
            marginTop: 4,
            display: 'flex',
            alignItems: 'baseline',
            minHeight: 31,
        } as React.CSSProperties,
        cursor: {
            display: 'inline-block',
            width: 2,
            height: '1em',
            background: '#7c3aed',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            opacity: showCursor ? 1 : 0,
            transition: 'opacity 0.1s',
        } as React.CSSProperties,
    };

    const shouldShowNameCursor = state === 'typing-name' || state === 'paused';
    const shouldShowMessageCursor = state === 'typing-message' || state === 'cursor-blink';

    return (
        <div style={styles.container}>
            <h1 style={styles.nameRow}>
                {displayedName}
                {shouldShowNameCursor && <span style={styles.cursor} />}
            </h1>
            {(state !== 'idle' && state !== 'typing-name') && (
                <p style={styles.messageRow}>
                    {displayedMessage}
                    {shouldShowMessageCursor && <span style={styles.cursor} />}
                </p>
            )}
        </div>
    );
};
