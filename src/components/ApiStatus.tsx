import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { getHealth } from '@/lib/api';

export function ApiStatus() {
  const [status, setStatus] = useState('확인 중');

  useEffect(() => {
    getHealth()
      .then((r) => setStatus(`연결됨 (${r.status})`))
      .catch(() => setStatus('연결 안 됨'));
  }, []);

  return <Text style={{ color: '#868E96' }}>백엔드: {status}</Text>;
}
