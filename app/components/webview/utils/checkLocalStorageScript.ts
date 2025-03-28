export const checkLocalStorageScript = `
        (() => {
            try {
                const isLocalStorageObjectAvailable = typeof window !== 'undefined' && window?.localStorage !== undefined;
                
                if (!isLocalStorageObjectAvailable) {
                    window.ReactNativeWebView.postMessage(
                        JSON.stringify({
                            data: {
                                name: 'localStorageStatus',
                                isAvailable: false,
                                isObjectAvailable: false,
                                keys: [],
                                totalSizeBytes: 0,
                                error: 'localStorage object is not available'
                            }
                        })
                    );
                    return;
                }

                localStorage.setItem('localStorageTest', 'test');
                const result = localStorage.getItem('localStorageTest');
                localStorage.removeItem('localStorageTest');
                
                const keys = [];
                let totalSize = 0;
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key !== null) {
                        keys.push(key);
                        const valueSize = (localStorage.getItem(key) || '').length * 2;
                        const keySize = key.length * 2;
                        totalSize += keySize + valueSize;
                    }
                }
                
                const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
                
                window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                        data: {
                            name: 'localStorageStatus',
                            isAvailable: result === 'test',
                            isObjectAvailable: true,
                            keys: keys,
                            totalSizeBytes: totalSize // Размер в байтах
                        }
                    })
                );
            } catch (error) {
                window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                        data: {
                            name: 'localStorageStatus',
                            isAvailable: false,
                            isObjectAvailable: typeof window !== 'undefined' && window?.localStorage !== undefined,
                            keys: [],
                            totalSizeBytes: 0,
                            error: error.message
                        }
                    })
                );
            }
        })();
`;