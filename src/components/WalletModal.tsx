import React, { useState } from "react";
import {
    useConnectWallet,
    useWallets,
    useCurrentWallet,
    useDisconnectWallet,
} from "@mysten/dapp-kit";

// 定义 Props 类型
interface WalletModalProps {
    onClose: () => void;
    onGameStart: () => void;
}

export function WalletModal({ onClose, onGameStart }: WalletModalProps) {
    const wallets = useWallets();
    // console.log("Wallets:", wallets);
    const filteredWallets = wallets.filter(
        (wallet) =>
            wallet.name === "Slush" ||
            wallet.name === "OKX Wallet"
    );
    const { mutate: connect } = useConnectWallet();
    const { mutate: disconnect } = useDisconnectWallet();
    const { currentWallet } = useCurrentWallet();
    const [error, setError] = useState<string>("");

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[1000] backdrop-blur-[10px]">
            <div className="absolute inset-0">
                <img
                    src="/img/cover_new.png"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
            </div>
            {/* 深色半透明遮罩层，确保文字可读性 */}
            <div className="absolute inset-0 bg-black/70"></div>

            <div className="relative z-10 w-[400px] bg-[rgba(20,20,20,0.95)] p-[30px] rounded-xl 
                          shadow-[0_0_10px_rgba(0,255,255,0.7)] text-center border-2 border-[rgba(0,255,255,0.5)]">
                <h2 className="text-[22px] font-bold mb-[15px] text-[#0ff]">
                    🔮 Select Wallet
                </h2>

                {/* Wallet List */}
                <ul className="list-none p-0 m-0">
                    {filteredWallets.length > 0 ? (
                        filteredWallets.map((wallet) => {
                            const isConnected = currentWallet && currentWallet.name === wallet.name;
                            let btnClass = "";
                            let icon = null;
                            let btnText = "";
                            if (wallet.name === "Slush") {
                                btnClass = isConnected
                                    ? "bg-gradient-to-r from-[#FBBC05] via-[#EA4335] to-[#4285F4] text-white shadow-[0_0_8px_#4285F4]"
                                    : "bg-gradient-to-r from-[#FBBC05] via-[#EA4335] to-[#4285F4] text-white shadow-[0_0_8px_#4285F4] hover:from-[#4285F4] hover:via-[#34A853] hover:to-[#FBBC05]";
                                icon = (
                                    <img src="/img/google_logo.svg" alt="Google" style={{ width: 20, height: 20, marginRight: 8, display: "inline-block", verticalAlign: "middle" }} />
                                );
                                btnText = isConnected
                                    ? `✅ Google (${currentWallet?.accounts?.[0]?.address.slice(0, 6)}...)`
                                    : "Connect with Google";
                            } else if (wallet.name === "OKX Wallet") {
                                btnClass = "border-2 border-[#000] bg-white text-[#000] shadow-[0_0_8px_#000] hover:bg-[#f2f2f2]";
                                icon = (
                                    <img src="/img/okx_logo.png" alt="OKX" style={{ width: 20, height: 20, marginRight: 8, display: "inline-block", verticalAlign: "middle" }} />
                                );
                                btnText = isConnected
                                    ? `✅ OKX (${currentWallet?.accounts?.[0]?.address.slice(0, 6)}...)`
                                    : "Connect OKX Wallet";
                            }

                            return (
                                <li key={wallet.name} className="mb-[10px]">
                                    <button
                                        onClick={() => {
                                            if (isConnected) {
                                                disconnect();
                                                return;
                                            }
                                            if (!wallet?.name) {
                                                setError("No wallet found. Please install Slush (Google) 或 OKX Wallet");
                                                return;
                                            }
                                            connect(
                                                { wallet },
                                                {
                                                    onSuccess: () => console.log(`✅ Connected: ${wallet.name}`),
                                                    onError: (err: Error) => setError(err.message),
                                                }
                                            );
                                        }}
                                        className={`w-full flex items-center justify-center p-[12px] text-[15px] font-bold rounded-[30px] cursor-pointer transition-all duration-300 ${btnClass}`}
                                        style={{ letterSpacing: "1px" }}
                                    >
                                        {icon}
                                        {btnText}
                                    </button>

                                    {/* Disconnect button */}
                                    {isConnected && (
                                        <button
                                            onClick={() => disconnect()}
                                            className="w-full mt-[5px] p-[8px] text-[14px] font-bold rounded-[30px] cursor-pointer
                                                     border-2 border-[#ff4500] bg-[rgba(255,69,0,0.15)] text-[#ff4500]
                                                     shadow-[0_0_5px_#ff4500] transition-all duration-300"
                                        >
                                            ❌ Disconnect
                                        </button>
                                    )}
                                </li>
                            );
                        })
                    ) : (
                        <p className="text-[#ff0090] text-[14px] mt-[10px] shadow-[0_0_5px_#ff0090]">
                            ❌ No wallet detected. Please install Slush (Google) 或 OKX Wallet
                        </p>
                    )}
                </ul>

                {/* Enter Game button */}
                <button
                    onClick={() => {
                        if (currentWallet) {
                            onGameStart();
                            onClose();
                        }
                    }}
                    disabled={!currentWallet}
                    className={`w-full mt-[20px] p-[12px] text-[16px] font-bold rounded transition-all duration-300
                              border-2 border-[#0ff] 
                              ${currentWallet
                            ? 'bg-[rgba(0,255,255,0.5)] text-[#0ff] cursor-pointer shadow-[0_0_8px_#0ff]'
                            : 'bg-[rgba(128,128,128,0.5)] text-[#888] cursor-not-allowed'
                        }`}
                >
                    🎮 Enter Game
                </button>
            </div>
        </div>
    );
}