/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import AdminPanel from './components/AdminPanel';
import ChatWidget from './components/ChatWidget';

export default function App() {
  return (
    <div className="h-screen w-full font-sans overflow-hidden">
      <ChatWidget />
    </div>
  );
}

