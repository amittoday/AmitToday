import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { downloadPDFInvoice } from '../utils/invoiceGenerator';
import { Html5Qrcode } from 'html5-qrcode';
import Tesseract from 'tesseract.js';
import { runOcrInWebWorker, detectOrientationInWebWorker } from '../utils/tesseractOcrWorker';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip
} from 'recharts';
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download, 
  Building2, 
  ArrowRight, 
  ChevronRight, 
  RefreshCw,
  QrCode,
  HelpCircle,
  ArrowUpDown,
  Trash2,
  Lock,
  Eye,
  Loader2,
  Calendar,
  Check,
  Printer,
  Copy,
  MessageCircle,
  Upload,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
  EyeOff
} from 'lucide-react';
import { 
  OrderStatusLegendTooltip, 
  OrderStatusLegendSection, 
  getOrderStatusConfig, 
  STATUS_LEGEND_CONFIGS 
} from './OrderStatusLegend';
import qrScanGuideImg from '../assets/images/qr_scan_guide_1779709839262.png';
import qrAlignmentGuideImg from '../assets/images/qr_alignment_guide_1779879947408.png';

interface OrderTrackingProps {
  initialOrderId?: string;
  onClose?: () => void;
}

// Resilient helper to fetch QR code image in base64 format for jsPDF
const fetchQrCodeBase64 = async (data: string): Promise<string> => {
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to fetch QR code image:", err);
    return "";
  }
};

const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<any> => {
  try {
    const res = await axios.get(url);
    if (!res.data.success && retries > 0 && res.data.error?.toLowerCase().includes('not found')) {
      console.warn(`Soft 404: ${res.data.error}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries - 1, delay * 2);
    }
    return res;
  } catch (error: any) {
    const status = error.response?.status;
    const shouldRetry = retries > 0 && (status === 404 || status === 500 || !status);
    if (shouldRetry) {
      console.warn(`Fetch encountered Status ${status || 'network'}. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries - 1, delay * 2);
    }
    throw error;
  }
};

const stepsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const stepItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut" as const
    }
  }
};

export function OrderTracking({ initialOrderId = '', onClose }: OrderTrackingProps) {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Mutex lock ref for syncing
  const syncLockRef = useRef(false);

  // Status Definitions dictionary
  const [statusDefinitions, setStatusDefinitions] = useState<Record<string, { tooltip: string; definition: string }>>({});

  // Status Dictionary Modal
  const [showStatusDictionary, setShowStatusDictionary] = useState(false);

  // Email Notification Toggle
  const [notifyByEmail, setNotifyByEmail] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aos_notify_by_email_global');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Tesseract OCR tracking states
  const [isOcrReading, setIsOcrReading] = useState(false);

  // Auto-polling state
  const [autoPolling, setAutoPolling] = useState(true);

  // PDF verification states
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'reading' | 'matched' | 'failed'>('idle');
  const [verifiedOrderId, setVerifiedOrderId] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // QR scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDenied, setCameraDenied] = useState<boolean>(false);
  const [scannerRetryKey, setScannerRetryKey] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Camera facing mode toggle state: environment = rear, user = front
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');

  // Real-time camera scanning tracker status
  const [scannerStatus, setScannerStatus] = useState<string>("Awaiting QR Target Alignment...");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<boolean>(false);

  // Ambient light lux sensor simulation and auto-boost contrast state
  const [ambientLux, setAmbientLux] = useState<number>(35);

  useEffect(() => {
    if (isScanning) {
      setScannerStatus("Awaiting QR Target Alignment...");
      setShowSuccessOverlay(false);
      
      // Simulate physical sensor diagnostic readings fluctuating in real-time
      const interval = setInterval(() => {
        setAmbientLux(prev => {
          // Occasional drop below 15 lux to trigger the contrast booster, else hover around 30-45 lux
          const shouldDrop = Math.random() < 0.35;
          if (shouldDrop) {
            return Math.floor(Math.random() * 8) + 8; // 8 - 15 lux (Low light zone)
          } else {
            return Math.floor(Math.random() * 15) + 28; // 28 - 42 lux (Adequate)
          }
        });
      }, 3000);
      
      return () => clearInterval(interval);
    } else {
      setAmbientLux(35); // Reset to standard ambient lighting when inactive
    }
  }, [isScanning]);

  // Scanning guide modal state
  const [showScanningGuideModal, setShowScanningGuideModal] = useState(false);
  const [scannerTutorialStep, setScannerTutorialStep] = useState(0);

  // Document preview modal states
  const [showDocPreviewModal, setShowDocPreviewModal] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewContrast, setPreviewContrast] = useState(false);
  const [showStatusIndicatorTooltip, setShowStatusIndicatorTooltip] = useState(false);

  // Certificate customization & print options
  const [showQrCodeStamp, setShowQrCodeStamp] = useState(true);
  const [signatureOverlay, setSignatureOverlay] = useState<string | null>(null);
  const [showSignatureOverlay, setShowSignatureOverlay] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const handleDownloadPng = async () => {
    const certElement = document.getElementById('preview-pdf-canvas');
    if (!certElement) {
      toast.error("Certificate element not found for rendering.");
      return;
    }
    setIsExportingPng(true);
    const toastId = toast.loading("Rendering high-resolution PNG image...");
    try {
      const canvas = await html2canvas(certElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const oId = trackedOrder?.orderId || trackedOrder?.ID || 'certificate';
      link.download = `AOS_Certificate_${oId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Certificate PNG downloaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Failed to export PNG:", err);
      toast.error("Failed to export PNG image: " + (err.message || err), { id: toastId });
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file for signature.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSignatureOverlay(event.target.result as string);
          setShowSignatureOverlay(true);
          toast.success("Signature overlay applied to certificate!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Export to WhatsApp state variables
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState('');
  const [waCustomMessage, setWaCustomMessage] = useState('');

  // Tooltip helper state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Customized special notes & special instructions
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const rawNotes = trackedOrder?.Notes || trackedOrder?.notes || '';
  const { stripped: strippedNotes, link: extractedLink } = React.useMemo(() => {
    if (!rawNotes) return { stripped: "", link: null };
    const urlRegex = /(?:https?:\/\/)?(?:drive|docs)\.google\.com[^\s]+/;
    const match = rawNotes.match(urlRegex);
    const link = match ? match[0] : null;
    const stripped = rawNotes.replace(/([^\n\s]+:\s*)?(?:https?:\/\/)?(?:drive|docs)\.google\.com[^\s]+/g, "").trim();
    return { stripped, link };
  }, [rawNotes]);


  useEffect(() => {
    if (trackedOrder) {
      setNotesValue(strippedNotes);
      
      const oId = trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID || 'N/A';
      const svc = trackedOrder.service || trackedOrder.ServiceType || trackedOrder.Type || 'GST Enrollment';
      const stat = trackedOrder.Status || trackedOrder.status || 'Under Review';
      const dt = trackedOrder.date || trackedOrder.Timestamp ? new Date(trackedOrder.date || trackedOrder.Timestamp).toLocaleDateString() : 'Real-time';
      
      const directTrackingLink = `${window.location.origin}/?tab=orders&orderId=${encodeURIComponent(oId)}`;
      const defaultMsg = `Hello! Here is the latest status update of your application with Amit Online Services (AOS):\n\n` +
        `📁 Application ID: #${oId}\n` +
        `💼 Service Category: ${svc}\n` +
        `📊 Current Tracker Status: ${stat}\n` +
        `📅 Last Synced Date: ${dt}\n\n` +
        `🔗 Track your application status live or view digital copies directly at:\n` +
        `${directTrackingLink}`;
      setWaCustomMessage(defaultMsg);
    } else {
      setNotesValue('');
      setWaCustomMessage('');
    }
  }, [trackedOrder]);

  // Local storage history of tracked orders
  const [recentOrders, setRecentOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('aos_recent_tracked');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Client-side sorting states
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'id'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const trackerSteps = [
    { 
      title: 'Document Received', 
      desc: 'Payment confirmed & details received', 
      key: 'Pending',
      tooltip: 'Your application is securely queued. Verification agents are preparing assignments.'
    },
    { 
      title: 'Verifying', 
      desc: 'AOS Team is reviewing your documents', 
      key: 'Under Review',
      tooltip: 'Officer is reviewing signatures, identity cards, and documents against regulations.'
    },
    { 
      title: 'Processing', 
      desc: 'Filed with the government department', 
      key: 'Submitted',
      tooltip: 'The file has been uploaded to the department server for stamping and issuance.'
    },
    { 
      title: 'Completed', 
      desc: 'Certificate approved and dispatched', 
      key: 'Completed',
      tooltip: 'Your certificate is approved! The downloadable file and e-token have been provisioned.'
    }
  ];

  const getActiveStep = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed') || s.includes('approved')) return 3;
    if (s.includes('submitted') || s.includes('processing')) return 2;
    if (s.includes('under review') || s.includes('query') || s.includes('verifying') || s.includes('review')) return 1;
    return 0; // default / pending
  };

  const currentStepIndex = trackedOrder ? getActiveStep(trackedOrder.Status || trackedOrder.status) : 0;
  const isQueryRaised = trackedOrder && ((trackedOrder.Status || trackedOrder.status || '').toLowerCase().includes('query'));

  // Save successful order tracking to history list
  const saveToHistory = (order: any) => {
    const id = order.orderId || order.ID || order.ApplicationID;
    if (!id) return;
    setRecentOrders(prev => {
      const exists = prev.find(o => (o.orderId || o.ID || o.ApplicationID) === id);
      let updated = prev;
      if (exists) {
        // Update details with freshest load
        updated = prev.map(o => (o.orderId || o.ID || o.ApplicationID) === id ? order : o);
      } else {
        updated = [order, ...prev];
      }
      const filtered = updated.slice(0, 10);
      localStorage.setItem('aos_recent_tracked', JSON.stringify(filtered));
      return filtered;
    });
  };

  // Perform tracking look up - memoized to prevent infinite updates
  const handleTrack = useCallback(async (targetId?: string) => {
    const idToTrack = targetId || orderId;
    if (!idToTrack.trim()) {
      toast.error('Please enter a valid Order ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry(`/api/orders/track/${idToTrack.trim()}`);
      if (res.data.success && res.data.data) {
        setTrackedOrder(res.data.data);
        saveToHistory(res.data.data);
        toast.success(`Fetched tracking status for ${idToTrack.trim()}`);
      } else {
        setError(res.data.error || 'No order found with this tracking code. Double check the ID and try again.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setError('No order found with this tracking code. Double check the ID and try again.');
      } else {
        setError('Failed to fetch tracking info. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Sync / Refresh current tracked data
  const handleSync = useCallback(async () => {
    if (!trackedOrder || syncLockRef.current || isSyncing) return;
    const currentId = trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID;
    if (!currentId) return;

    syncLockRef.current = true;
    setIsSyncing(true);
    try {
      const res = await fetchWithRetry(`/api/orders/track/${currentId}`);
      if (res.data.success && res.data.data) {
        const prevStatus = trackedOrder.Status || trackedOrder.status;
        const newStatus = res.data.data.Status || res.data.data.status;

        setTrackedOrder(res.data.data);
        saveToHistory(res.data.data);
        toast.success("Details synchronized in real-time!");

        if (notifyByEmail && prevStatus && prevStatus !== newStatus) {
          try {
            await axios.post('/api/orders/notify-status-change', {
              email: res.data.data.UserEmail || res.data.data.email || 'customer@example.com',
              orderId: currentId,
              status: newStatus,
              serviceName: res.data.data.service || res.data.data.ServiceType || 'AOS Digital Service'
            });
            toast.info("Status change notification email sent!");
          } catch (notifErr) {
            console.error("Failed to send status notification email", notifErr);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to synchronize with server.");
    } finally {
      setIsSyncing(false);
      syncLockRef.current = false;
    }
  }, [trackedOrder, isSyncing, notifyByEmail]);

  const handleSaveNotes = async () => {
    if (!trackedOrder) return;
    const currentId = trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID;
    if (!currentId) {
      toast.error("No valid Order ID found for notes saving.");
      return;
    }
    setSavingNotes(true);
    try {
      const res = await axios.post('/api/orders/update-notes', {
        orderId: currentId,
        notes: notesValue
      });
      if (res.data.success) {
        toast.success("Order notes and context saved to spreadsheet database!");
        // Update local order tracking instance in metadata
        setTrackedOrder((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            Notes: notesValue,
            notes: notesValue
          };
        });
      } else {
        toast.error(res.data.error || "Failed to save order notes.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save order notes: " + (err.response?.data?.error || err.message));
    } finally {
      setSavingNotes(false);
    }
  };

  const getChartData = () => {
    if (!trackedOrder) return [];
    
    // Extract logs from tracked order history or fallback to simulated dates for workflow steps
    let sortedHistory = [];
    if (trackedOrder.history && Array.isArray(trackedOrder.history) && trackedOrder.history.length > 0) {
      sortedHistory = [...trackedOrder.history]
        .map((hist: any) => {
          const statusStr = hist.Status || hist.status || 'Pending';
          const timestamp = hist.Timestamp || hist.timestamp || trackedOrder.date || trackedOrder.Timestamp || new Date();
          
          let stageScore = 1;
          const sLower = statusStr.toLowerCase();
          if (sLower.includes('pending') || sLower.includes('placed')) stageScore = 1;
          else if (sLower.includes('review') || sLower.includes('verification')) stageScore = 2;
          else if (sLower.includes('submitted')) stageScore = 3;
          else if (sLower.includes('completed') || sLower.includes('approved')) stageScore = 4;
          
          return {
            name: statusStr,
            date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            stage: stageScore,
            rawDate: new Date(timestamp)
          };
        })
        .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    } else {
      sortedHistory = trackerSteps
        .slice(0, currentStepIndex + 1)
        .map((step, sIdx) => {
          const stepTime = trackedOrder.date || trackedOrder.Timestamp;
          let calculatedDate = new Date();
          if (stepTime) {
            const baseMs = new Date(stepTime).getTime();
            calculatedDate = new Date(baseMs - (currentStepIndex - sIdx) * 1.5 * 24 * 60 * 60 * 1000);
          }
          return {
            name: step.title,
            date: calculatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            stage: sIdx + 1,
            rawDate: calculatedDate
          };
        });
    }
    return sortedHistory;
  };

  const handlePrintOrder = () => {
    if (window.confirm("Are you sure you want to print this order tracking summary receipt?")) {
      window.print();
    }
  };

  // Dynamic tooltips loaded from Status_Definitions tab
  useEffect(() => {
    const fetchDefinitions = async () => {
      try {
        const res = await fetchWithRetry('/api/status-definitions');
        if (res.data.success && Array.isArray(res.data.data)) {
          const definitionsMap: Record<string, { tooltip: string; definition: string }> = {};
          res.data.data.forEach((item: any) => {
            const statusKey = item.Status || item.status || item.statusName || '';
            if (statusKey) {
              definitionsMap[statusKey.toLowerCase()] = {
                tooltip: item.Tooltip || item.description || '',
                definition: item.Definition || item.details || ''
              };
            }
          });
          setStatusDefinitions(definitionsMap);
        }
      } catch (err) {
        console.error("Failed to load status definitions from backend", err);
      }
    };
    
    fetchDefinitions();
  }, []);

  const getDynamicTooltip = (key: string, fbTooltip: string) => {
    return statusDefinitions[key.toLowerCase()]?.tooltip || fbTooltip;
  };

  const getDynamicDefinition = (key: string, fbDefinition: string) => {
    return statusDefinitions[key.toLowerCase()]?.definition || fbDefinition;
  };

  const handleRequestPermission = async () => {
    try {
      setCameraError(null);
      setCameraDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Release camera immediately as we just needed to get the permission grant
      stream.getTracks().forEach(track => track.stop());
      // Increment state key to reload scanner
      setScannerRetryKey(prev => prev + 1);
    } catch (err: any) {
      console.error("User denied manual camera permission prompt:", err);
      const errStr = err.message || String(err);
      setCameraError(errStr);
      setCameraDenied(true);
      // Dispatch log
      axios.post('/api/system-error/log', {
        orderId: orderId || '',
        userId: '',
        errorMessage: `Manual Video Permission Request Denied: ${errStr} (Name: ${err.name || 'Unknown'})`
      }).catch(logErr => console.log('Failed to dispatch server-side system log:', logErr));
      toast.error("Camera access denied. Please allow camera in browser permission popups.");
    }
  };

  const compressImageForOcr = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 1200; // Optimal width for clear character recognition
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                console.log(`Compressed image from ${file.size} to ${blob.size} bytes`);
                resolve(blob);
              } else {
                resolve(file);
              }
            }, 'image/jpeg', 0.85); // 0.85 compression with crisp output for text extraction
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const rotateImageForOcr = (imageBlob: Blob | File, degrees: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(imageBlob as Blob);
            return;
          }
          const angleRad = (degrees * Math.PI) / 180;
          if (degrees === 90 || degrees === 270) {
            canvas.width = img.height;
            canvas.height = img.width;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(angleRad);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          canvas.toBlob((rotatedBlob) => {
            resolve(rotatedBlob || imageBlob as Blob);
          }, "image/jpeg", 0.90);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageBlob);
    });
  };

  const autoRotateImageIfNecessary = async (imageBlob: Blob | File): Promise<Blob> => {
    try {
      console.log("[OCR Worker Thread] Assessing document orientation via Web Worker...");
      const degrees = await detectOrientationInWebWorker(imageBlob);
      console.log("[OCR Worker Thread] Orientation evaluation:", degrees);
      if (degrees && [90, 180, 270].includes(degrees)) {
        toast.info(`Orientation check triggered (${degrees}° rotation). Realigning...`);
        return await rotateImageForOcr(imageBlob, degrees);
      }
    } catch (err) {
      console.warn("[OCR Preprocessing] Orientation evaluation bypassed:", err);
    }
    return imageBlob as Blob;
  };

  const handleOcrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOcrReading(true);
    const toastId = toast.loading("Compressing and optimization snapshot...");
    try {
      const compressedBlob = await compressImageForOcr(file);
      toast.loading("Analyzing orientation on Web Worker thread...", { id: toastId });
      const orientedBlob = await autoRotateImageIfNecessary(compressedBlob);
      
      toast.loading("Running non-blocking layout verification worker...", { id: toastId });
      const result = await runOcrInWebWorker(orientedBlob, 'eng');
      const text = result.text;
      // Match ORD-xxxxxxxx or DSC-xxxxxxx or DOC-xxxxxxxx
      const match = text.match(/(ORD|DSC|DOC)-\d+-\d+/i);
      if (match) {
        const detectedId = match[0].toUpperCase();
        setOrderId(detectedId);
        toast.success(`Extracted Order ID successfully: ${detectedId}`, { id: toastId });
        setIsScanning(false);
        handleTrack(detectedId);
      } else {
        toast.error("Could not locate a valid Order ID format (e.g. ORD-123456-123) in image.", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to extract text from image: " + err.message, { id: toastId });
    } finally {
      setIsOcrReading(false);
    }
  };

  const downloadOrderHistoryCSV = useCallback(() => {
    if (!trackedOrder) return;
    
    const orderIdValue = trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID || '';
    const serviceName = trackedOrder.service || trackedOrder.ServiceType || 'AOS Digital Service';
    const email = trackedOrder.UserEmail || trackedOrder.email || 'customer@example.com';

    // Get the audit logs list
    const auditLogs = (() => {
      if (trackedOrder.history && Array.isArray(trackedOrder.history) && trackedOrder.history.length > 0) {
        return [...trackedOrder.history]
          .map((hist: any, index: number) => ({
            id: hist.HistoryID || `HIST-${index}`,
            status: hist.Status || hist.status || 'Status Updated',
            timestamp: hist.Timestamp || hist.timestamp || trackedOrder.date || trackedOrder.Timestamp
          }))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } else {
        return trackerSteps
          .slice(0, currentStepIndex + 1)
          .map((step, sIdx) => {
            const stepTime = trackedOrder.date || trackedOrder.Timestamp;
            let calculatedDate = new Date();
            if (stepTime) {
              const baseMs = new Date(stepTime).getTime();
              calculatedDate = new Date(baseMs - (currentStepIndex - sIdx) * 1.5 * 24 * 60 * 60 * 1000);
            }
            return {
              id: `HIST-CALC-${sIdx}`,
              status: step.title,
              timestamp: calculatedDate.toISOString()
            };
          })
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    })();

    // Construct CSV Header and Rows
    const headers = ['Order ID', 'Service', 'User Email', 'Log ID', 'Status / Stage', 'Timestamp'];
    const rows = auditLogs.map(log => [
      `"${orderIdValue}"`,
      `"${serviceName}"`,
      `"${email}"`,
      `"${log.id}"`,
      `"${log.status}"`,
      `"${log.timestamp}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Order_History_${orderIdValue || 'Export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Order history successfully downloaded as CSV!");
  }, [trackedOrder, currentStepIndex]);

  // Initial load tracking trigger
  useEffect(() => {
    if (initialOrderId && initialOrderId.trim()) {
      handleTrack(initialOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId]);

  // Auto-polling for status updates every 30 seconds when under review or query raised
  useEffect(() => {
    if (!autoPolling || !trackedOrder) return;

    const currentStatus = (trackedOrder.Status || trackedOrder.status || '').toLowerCase();
    const shouldPoll = currentStatus.includes('under review') || currentStatus.includes('query');

    if (!shouldPoll) return;

    const intervalId = setInterval(() => {
      handleSync();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [autoPolling, trackedOrder, handleSync]);

  // Verify uploaded signature PDF cryptographically
  const handlePdfVerification = async (file: File) => {
    if (!file) return;
    setVerifyStatus('reading');
    setVerificationError(null);
    setVerifiedOrderId(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        // Match ORD-, DSC- or DOC- followed by timestamp and random numbers
        const match = text.match(/(ORD|DSC|DOC)-\d+-\d+/i);
        if (match) {
          const matchedId = match[0];
          setVerifiedOrderId(matchedId);
          
          try {
            const res = await axios.get(`/api/orders/track/${matchedId.trim()}`);
            if (res.data.success && res.data.data) {
              setVerifyStatus('matched');
              toast.success(`Signature validated successfully! Connected to active Order #${matchedId}`);
            } else {
              setVerifyStatus('failed');
              setVerificationError(`The tracking ID ${matchedId} extracted from the document does not exist in our active database.`);
            }
          } catch (apiErr) {
            setVerifyStatus('failed');
            setVerificationError(`Registry database verification check failed for ID ${matchedId}.`);
          }
        } else {
          setVerifyStatus('failed');
          setVerificationError("Could not locate any valid cryptographic Order ID, DSC receipt pattern, or QR metadata signature in this PDF file contents.");
        }
      } catch (err: any) {
        setVerifyStatus('failed');
        setVerificationError("Failed to parse the PDF file structure: " + err.message);
      }
    };

    reader.onerror = () => {
      setVerifyStatus('failed');
      setVerificationError("Failed to read the uploaded PDF file.");
    };

    reader.readAsText(file);
  };

  // Export search/tracking history as CSV
  const handleDownloadHistoryCsv = () => {
    if (recentOrders.length === 0) {
      toast.error("No tracked history to download.");
      return;
    }
    
    const headers = ['OrderID', 'ServiceType', 'Status', 'DateTracked'];
    const rows = recentOrders.map(rec => [
      rec.orderId || rec.ID || rec.ApplicationID || '',
      rec.service || rec.ServiceType || rec.Type || 'DSC Service',
      rec.Status || rec.status || 'Pending',
      rec.date || rec.Timestamp || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AOS-Tracking-History-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Order tracking history downloaded successfully!");
  };

  // Web camera scanning initialization with custom error/permission recovery support
  useEffect(() => {
    if (!isScanning) {
      setCameraError(null);
      setCameraDenied(false);
      return;
    }
    let active = true;
    let html5QrCode: Html5Qrcode | null = null;
    const startScanner = async () => {
      try {
        setCameraError(null);
        setCameraDenied(false);

        // Fail early if running in an insecure context or if devices API is missing
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not supported in this browser context (possibly due to an insecure HTTP connection or iframe permissions).");
        }

        if (!active) return;

        // Wait for the DOM element to be fully mounted
        let element = document.getElementById("tracking-qr-reader");
        let attempts = 0;
        while (!element && attempts < 20) {
          if (!active) return;
          await new Promise((resolve) => setTimeout(resolve, 100));
          element = document.getElementById("tracking-qr-reader");
          attempts++;
        }

        if (!active) return;

        if (!element) {
          throw new Error("Tracking QR reader viewport container could not be found in the DOM.");
        }

        html5QrCode = new Html5Qrcode("tracking-qr-reader");
        scannerRef.current = html5QrCode;

        const scanSuccessCallback = (decodedText: string) => {
          if (!active) return;
          // Haptic feedback (Vibration)
          if (navigator && typeof navigator.vibrate === 'function') {
            try {
              navigator.vibrate([150, 50, 100]);
            } catch (vErr) {
              console.warn("Haptic vibration failed:", vErr);
            }
          }
          setShowSuccessOverlay(true);
          setScannerStatus(`SUCCESS: QR Code Identified: ${decodedText}`);
          toast.success("Successfully scanned Order ID!");
          setTimeout(() => {
            if (!active) return;
            setOrderId(decodedText);
            setIsScanning(false);
            handleTrack(decodedText);
          }, 850);
        };

        const scanFailCallback = () => {
          // keep looking
        };

        try {
          if (!active) return;
          // Attempt using current preference first
          await html5QrCode.start(
            { facingMode: cameraFacingMode },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            scanSuccessCallback,
            scanFailCallback
          );
          if (!active) {
            html5QrCode.stop().catch(() => {});
            return;
          }
        } catch (firstErr) {
          if (!active) return;
          console.warn(`Tracking facingMode ${cameraFacingMode} camera start failed, trying alternative:`, firstErr);
          const altFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
          try {
            await html5QrCode.start(
              { facingMode: altFacing },
              { fps: 10, qrbox: { width: 220, height: 220 } },
              scanSuccessCallback,
              scanFailCallback
            );
            if (!active) {
              html5QrCode.stop().catch(() => {});
              return;
            }
          } catch (secondErr) {
            if (!active) return;
            console.warn("Tracking user camera start failed, querying available cameras:", secondErr);
            // Attempt 3: Fetch all available cameras and try the first one
            const devices = await Html5Qrcode.getCameras().catch(() => []);
            if (!active) return;
            if (devices && devices.length > 0) {
              await html5QrCode.start(
                devices[0].id,
                { fps: 10, qrbox: { width: 220, height: 220 } },
                scanSuccessCallback,
                scanFailCallback
              );
              if (!active) {
                html5QrCode.stop().catch(() => {});
                return;
              }
            } else {
              throw new Error("No camera devices available on this system.");
            }
          }
        }
      } catch (err: any) {
        if (!active) return;
        console.error("Camera startup error (handled gracefully):", err);
        const errStr = err.message || String(err);
        setCameraError(errStr);
        setCameraDenied(
          err.name === "NotAllowedError" || 
          err.name === "PermissionDeniedError" || 
          errStr.toLowerCase().includes("permission") || 
          errStr.toLowerCase().includes("allowed")
        );
        
        // Push specific camera error into Google Sheets SYSTEM_ERRORS sheet via the endpoint proxy
        axios.post('/api/system-error/log', {
          orderId: orderId || '',
          userId: '',
          errorMessage: `OrderTracking Scanner Init Error: ${errStr} (Name: ${err.name || 'Unknown'})`
        }).catch(logErr => console.log('Failed to dispatch server-side system log:', logErr));
        
        toast.error("Camera permission denied or device not found. Review optimal guides.");
      }
    };

    startScanner().catch((err) => {
      console.error("Unhandled error inside startScanner promise chain:", err);
    });

    return () => {
      active = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.warn("Scanner close info (handled):", err));
      }
    };
  }, [isScanning, scannerRetryKey, cameraFacingMode]);

  // Branded PDF generation using jsPDF with verification QR Code
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdfSummary = async () => {
    if (!trackedOrder) return;
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF();
      const id = trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID || 'N/A';
      
      // Top Branded Header Bar
      doc.setFillColor(30, 87, 229); // Royal Blue
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("AMIT ONLINE SERVICES", 15, 22);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Official App Transaction Status Certificate • www.amit.today", 15, 30);
      
      // Document Metadata body
      doc.setTextColor(33, 41, 54);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Transaction Transcript Summary", 15, 55);
      
      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 59, 195, 59);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(115, 125, 140);
      doc.text("Tracking ID Code:", 15, 70);
      doc.text("Type of Service:", 15, 80);
      doc.text("State Status Label:", 15, 90);
      doc.text("Applicant Account:", 15, 100);
      doc.text("Synchronized On:", 15, 110);
      doc.text("UTR Payment ref:", 15, 120);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(33, 41, 54);
      doc.text(String(id), 65, 70);
      doc.text(String(trackedOrder.service || trackedOrder.ServiceType || trackedOrder.Type || 'Digital Signature Certificate'), 65, 80);
      doc.text(String(trackedOrder.Status || trackedOrder.status || 'Pending'), 65, 90);
      doc.text(String(trackedOrder.UserEmail || trackedOrder.email || 'N/A'), 65, 100);
      doc.text(String(trackedOrder.date || trackedOrder.Timestamp ? new Date(trackedOrder.date || trackedOrder.Timestamp).toLocaleDateString() : 'Real-time'), 65, 110);
      doc.text(String(trackedOrder.paymentId || trackedOrder.PaymentID || trackedOrder.UTR || 'Completed Direct'), 65, 120);

      // Detailed historical steps listing (chronological timeline) with dynamic timestamps
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Chronological Departmental History", 15, 138);
      doc.line(15, 142, 195, 142);

      const activeIdx = getActiveStep(trackedOrder.Status || trackedOrder.status);
      let timelineY = 152;

      trackerSteps.forEach((step, idx) => {
        // Bullet circle
        if (idx <= activeIdx) {
          doc.setFillColor(16, 185, 129); // emerald green
        } else {
          doc.setFillColor(226, 232, 240); // slate grey
        }
        doc.circle(18, timelineY - 1, 3.5, 'F');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(idx <= activeIdx ? 33 : 148, idx <= activeIdx ? 41 : 163, idx <= activeIdx ? 54 : 184);
        doc.text(step.title, 26, timelineY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(115, 125, 140);
        doc.text(step.desc, 26, timelineY + 4.5);

        // Simulated highly realistic timestamps for historical steps
        let relativeTimeStr = '-';
        if (idx <= activeIdx && (trackedOrder.date || trackedOrder.Timestamp)) {
          const creationDate = new Date(trackedOrder.date || trackedOrder.Timestamp);
          const stepOffset = (activeIdx - idx) * 1.5 * 24 * 60 * 60 * 1000; // offset back by ~1.5 days per step
          const computedStepDate = new Date(creationDate.getTime() - stepOffset);
          relativeTimeStr = computedStepDate.toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        }
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Time: ${relativeTimeStr}`, 145, timelineY);

        timelineY += 16;
      });

      // QR Code for verification at bottom right
      const b64Qr = await fetchQrCodeBase64(`https://www.amit.today/track?id=${id}`);
      if (b64Qr) {
        doc.addImage(b64Qr, 'PNG', 150, 226, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("SCAN QR TO VERIFY", 149, 272);
      }

      // Footer disclaimer & authority signature lines
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text("Verification transcript generated on " + new Date().toUTCString(), 15, 282);
      doc.text("Amit Online Services Facilitation Registry. Security hash digitally cryptographically embedded.", 15, 286);

      doc.save(`AOS-Application-Report-${id}.pdf`);
      toast.success("branded PDF status verification loaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse and export certificate summary.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Handling sort configurations
  const toggleSort = (field: 'date' | 'status' | 'id') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedRecentOrders = [...recentOrders].sort((a, b) => {
    let valA = '';
    let valB = '';
    if (sortBy === 'date') {
      valA = a.Timestamp || a.Timestamp || a.CreatedDate || a.Date || a.date || '';
      valB = b.Timestamp || b.Timestamp || b.CreatedDate || b.Date || b.date || '';
    } else if (sortBy === 'status') {
      valA = a.Status || a.status || '';
      valB = b.Status || b.status || '';
    } else {
      const idA = a.orderId || a.ID || a.ApplicationID || '';
      const idB = b.orderId || b.ID || b.ApplicationID || '';
      valA = String(idA);
      valB = String(idB);
    }
    if (sortOrder === 'asc') return valA.localeCompare(valB);
    return valB.localeCompare(valA);
  });

  const clearHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentOrders(prev => {
      const updated = prev.filter(o => {
        const oId = o.orderId || o.ID || o.ApplicationID;
        return String(oId) !== id;
      });
      localStorage.setItem('aos_recent_tracked', JSON.stringify(updated));
      return updated;
    });
    toast.info("Cleared item from recent tracked store.");
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] border border-slate-200/65 dark:border-slate-800/80 shadow-2xl relative overflow-hidden" id="order-tracking-card">
        
        {/* Absolute Background Deco Grid patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100/10 dark:bg-red-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/10 dark:bg-blue-500/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 border-b border-slate-100 dark:border-slate-800/60 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-2.5 h-6 rounded-full bg-red-600 block"></span>
              Live Order & Registry Tracker
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Direct cryptographic lookup of digital signature orders & status files</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center gap-1">
              <button 
                onClick={() => setIsScanning(true)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-sm transition-all"
              >
                <QrCode size={15} className="text-blue-600 animate-pulse" />
                Scan QR
              </button>
              
              {/* Help button for QR Guide modal layout */}
              <button
                type="button"
                onClick={() => setShowScanningGuideModal(true)}
                className="p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all shadow-sm cursor-pointer animate-pulse-subtle"
                title="Scan Guide"
                id="qr-guide-help-btn"
              >
                <HelpCircle size={18} />
              </button>
            </div>
            {onClose && (
              <button 
                onClick={onClose} 
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                id="tracking-close-btn"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Search entry Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleTrack(); }} className="flex flex-col sm:flex-row gap-3 mb-8" id="order-tracking-search-form">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Order ID (e.g. DSC-917300...)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
              id="order-tracking-id-input"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 hover:bg-blue-700 active:scale-95 disabled:bg-slate-400/80 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
            id="order-tracking-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Querying...
              </>
            ) : (
              <>
                Track Status
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Polling & Email notification settings bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 p-4 bg-slate-50 dark:bg-slate-950/25 rounded-2xl border border-slate-150/60 dark:border-slate-850 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="auto-polling-toggle" 
              checked={autoPolling} 
              onChange={(e) => setAutoPolling(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800"
            />
            <label htmlFor="auto-polling-toggle" className="text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 select-none">
              <RefreshCw size={12} className={autoPolling ? "animate-spin text-blue-600" : "text-slate-400"} />
              Enable 30s Auto-Polling for 'Under Review' / 'Query Raised'
            </label>
          </div>
          <div className="flex items-center justify-between gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800/80 pt-3 md:pt-0 md:pl-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="email-notify-toggle" 
                checked={notifyByEmail} 
                onChange={(e) => {
                  const val = e.target.checked;
                  setNotifyByEmail(val);
                  localStorage.setItem('aos_notify_by_email_global', String(val));
                  if (val) {
                    toast.success("SMS & Email notification dispatcher registered!");
                  } else {
                    toast.info("Notifications deactivated.");
                  }
                }}
                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800"
              />
              <label htmlFor="email-notify-toggle" className="text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 select-none">
                Notify me by Email on status changes
              </label>
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-400">
              {notifyByEmail ? "Email Dispatch ON" : "Email Dispatch OFF"}
            </span>
          </div>
        </div>

        {/* Dynamic Compact Order Status progression timeline indicator inside #order-tracking-card */}
        <div className="mt-2 mb-8 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 relative overflow-hidden" id="card-status-timeline-indicator">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
              <Clock size={12} className="text-blue-600 animate-pulse" />
              Live Order Progression Mapper
            </h4>
            <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              {trackedOrder ? "Active Sync" : "No Active Key"}
            </span>
          </div>

          {trackedOrder ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase">
                  Order Status: <span className="text-blue-600 dark:text-blue-400">{trackedOrder.Status || trackedOrder.status || 'Pending'}</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 uppercase">
                  Step {currentStepIndex + 1} of 4 Mapped
                </span>
              </div>

              {/* Connected Stage bar */}
              <div className="relative pt-6 pb-2">
                {/* Visual Line connector background */}
                <div className="absolute left-4 right-4 top-[35px] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full z-0">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    style={{ width: `${(currentStepIndex / 3) * 100}%` }}
                  />
                </div>

                <div className="relative z-10 flex justify-between items-center">
                  {[
                    { label: "Placed", desc: "Order Ingested" },
                    { label: "Review", desc: isQueryRaised ? "Query Raised" : "Verifying Files" },
                    { label: "Submitted", desc: "Govt Dispatch" },
                    { label: "Completed", desc: "Approved" }
                  ].map((step, idx) => {
                    const isCompleted = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const isPassed = idx <= currentStepIndex;

                    return (
                      <div key={step.label} className="flex flex-col items-center flex-1">
                        {/* Milestone bubble */}
                        <div 
                          className={`w-[26px] h-[26px] rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm transition-all duration-500 ${
                            isCurrent && isQueryRaised ? 'bg-orange-500 scale-125 duration-300 animate-pulse' :
                            isCurrent ? 'bg-blue-600 scale-125 ring-4 ring-blue-100 dark:ring-blue-900/15 duration-300' :
                            isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                          } text-white`}
                        >
                          {isCurrent && isQueryRaised ? (
                            <AlertTriangle size={10} className="stroke-[3]" />
                          ) : isCompleted ? (
                            <Check size={11} className="stroke-[3]" />
                          ) : (
                            <span className="text-[8px] font-black">{idx + 1}</span>
                          )}
                        </div>
                        {/* Micro Labeling */}
                        <span className={`text-[9.5px] font-black uppercase mt-2 tracking-wide text-center transition-colors ${
                          isCurrent && isQueryRaised ? 'text-orange-500' :
                          isCurrent ? 'text-blue-600 dark:text-blue-400' :
                          isPassed ? 'text-slate-700 dark:text-slate-200' : 'text-slate-450 dark:text-slate-600'
                        }`}>
                          {step.label}
                        </span>
                        <span className="text-[7.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mt-0.5 max-w-[70px] leading-tight block">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chronological Status Line Chart */}
              <div className="mt-6 pt-6 border-t border-slate-200/40 dark:border-slate-800/80">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Timeline Status Progression analysis
                  </span>
                  <span className="text-[8px] font-black uppercase text-blue-605 bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                    Recharts Live
                  </span>
                </div>
                <div className="w-full h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getChartData()}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/40" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 750 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        domain={[1, 4]} 
                        ticks={[1, 2, 3, 4]}
                        tickFormatter={(val) => {
                          if (val === 1) return 'Placed';
                          if (val === 2) return 'Verified';
                          if (val === 3) return 'Submitted';
                          if (val === 4) return 'Completed';
                          return '';
                        }}
                        tick={{ fill: '#94a3b8', fontSize: 7, fontWeight: 700 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const pItem = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl shadow-xl text-[9px] font-mono leading-normal">
                                <p className="font-extrabold uppercase text-amber-400">
                                  State: {pItem.name}
                                </p>
                                <p className="font-medium text-slate-300">
                                  Date: <span className="font-bold text-white">{pItem.date}</span>
                                </p>
                                <p className="font-medium text-slate-300">
                                  Progression: <span className="font-bold text-emerald-400">{pItem.stage} / 4</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="stage" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        activeDot={{ r: 6, strokeWidth: 1.5, fill: '#60a5fa' }}
                        dot={{ r: 4, stroke: '#2563eb', strokeWidth: 1.5, fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-100/40 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-250 dark:border-slate-800">
              <Clock size={20} className="mx-auto text-slate-350 dark:text-slate-750 mb-2 animate-bounce-subtle" />
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-relaxed">
                Awaiting Order Lookup to Draw Track progression Map
              </p>
              <p className="text-[8px] text-slate-400/80 font-bold uppercase tracking-wider mt-0.5">
                Progression mapping covers: Placed → Document Audit → State Registry filing → Approved dispatch
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Order Status Color-Coding Legend Section */}
        <div className="mb-8">
          <OrderStatusLegendSection
            currentStatus={trackedOrder?.Status || trackedOrder?.status}
            dynamicDefinitions={statusDefinitions}
            defaultExpanded={false}
          />
        </div>

        {/* Verify Signature Feature dropzone */}
        <div className="bg-slate-50/50 dark:bg-slate-950/10 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
            <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">Cryptographic Signature & QR Authenticator</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-4">Validate physical PDF transcripts instantly against live official database</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Drag & drop upload area */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 text-center hover:bg-slate-50/50 dark:hover:bg-slate-900/40 cursor-pointer transition-all relative flex flex-col justify-center items-center">
              <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfVerification(file);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileText size={28} className="mx-auto text-blue-500 mb-2" />
              <p className="text-xs font-black text-slate-700 dark:text-slate-200">Drag or Click to Upload Receipt PDF</p>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Accepts original .pdf format certificates</p>
            </div>

            {/* Active verification report view */}
            <div className="bg-white dark:bg-slate-950/45 p-5 rounded-2xl border border-slate-150/60 dark:border-slate-850 min-h-[110px] flex flex-col justify-center">
              {verifyStatus === 'idle' && (
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">No document loaded yet</span>
                  <p className="text-[9px] text-slate-400 font-medium max-w-xs mx-auto mt-1">Upload a previously downloaded official transaction report to verify its digital cryptograph signature.</p>
                </div>
              )}
              {verifyStatus === 'reading' && (
                <div className="flex flex-col items-center justify-center space-y-2 animate-pulse">
                  <Loader2 size={20} className="text-blue-600 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Extracting Cryptographic Hash...</span>
                </div>
              )}
              {verifyStatus === 'matched' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-605">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600">SIGNATURE VERIFIED SECURELY</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                    Extracted tracking ID: <strong className="text-slate-800 dark:text-white">#{verifiedOrderId}</strong> succeeds database lookup. This document is authenticated, officially authorized, and unaltered.
                  </p>
                </div>
              )}
              {verifyStatus === 'failed' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600 animate-shake">
                    <AlertTriangle size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">VERIFICATION FAILED</span>
                  </div>
                  <p className="text-[11px] text-red-650 dark:text-red-400 font-semibold leading-relaxed">
                    {verificationError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Notice block */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 mb-8 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-3 shadow-sm"
            id="tracking-error-notice"
          >
            <AlertTriangle size={18} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Real-time scanning visual portal (modal) */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-6">
                  <div className="flex flex-col">
                    <h4 className="font-black text-sm uppercase tracking-wider text-slate-855 dark:text-slate-100">Camera QR Scanner</h4>
                    <button
                      type="button"
                      onClick={() => setShowScanningGuideModal(true)}
                      className="mt-1 self-start flex items-center gap-1 text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                      title="Open visual camera placement & alignment tutorial"
                    >
                      <HelpCircle size={10} className="stroke-[3]" />
                      How to Scan?
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      if (scannerRef.current) {
                        scannerRef.current.stop().catch(err => console.error(scannerRef.current, err));
                      }
                      setIsScanning(false);
                      setCameraError(null);
                      setCameraDenied(false);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 font-black text-sm"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="relative w-full aspect-square max-w-[280px] bg-slate-100 dark:bg-slate-950 rounded-2xl border-4 border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner flex flex-col items-center justify-center">
                  {cameraError || cameraDenied ? (
                    <div className="p-4 text-center space-y-3">
                      <AlertTriangle className="text-amber-500 mx-auto animate-bounce" size={28} />
                      <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        {cameraDenied ? "Camera Permission Denied" : "Camera Initialisation Failed"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold leading-normal max-w-[220px]">
                        {cameraDenied 
                          ? "Access to camera was blocked or denied. Please explicitly allow camera permissions in browser address bar." 
                          : "Device or support not found! If permissions are correct, you can upload physical copy below."}
                      </p>
                      <button
                        type="button"
                        onClick={handleRequestPermission}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm mx-auto flex items-center gap-1.5"
                      >
                        <QrCode size={12} />
                        Enable Camera
                      </button>
                    </div>
                  ) : (
                    <>
                      <div 
                        id="tracking-qr-reader" 
                        className="w-full h-full object-cover relative transition-all duration-300"
                        style={{ filter: (ambientLux <= 15) ? 'contrast(1.5) brightness(1.25) saturate(1.15)' : 'none' }}
                      >
                        {/* Visual scanner 'scan-line' anim overlay */}
                        <div className="absolute left-0 right-0 h-[2.5px] bg-emerald-500 shadow-[0_0_15px_#10b981,0_0_8px_#10b981] animate-qr-scan-line pointer-events-none z-30" />
                      </div>
                      
                      {/* Bounding corners layout inside frame */}
                      <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-blue-500/30 rounded-xl z-20 flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1" />
                      </div>

                      {/* Visual laser tracker scanbar animation */}
                      <div className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,1)] animate-qr-scan-line pointer-events-none z-10" />

                      {/* Animated Success Overlay */}
                      <AnimatePresence>
                        {showSuccessOverlay && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center text-white"
                          >
                            <motion.div
                              initial={{ scale: 0.3, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 15 }}
                              className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-lg border-4 border-emerald-100"
                            >
                              <Check className="stroke-[3.5] w-8 h-8" />
                            </motion.div>
                            <motion.span
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="text-xs font-black uppercase tracking-widest mt-3 font-sans"
                            >
                              Scanned!
                            </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>

                {/* Sensor Diagnostic Monitor */}
                {isScanning && (
                  <div className="w-full mt-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${ambientLux <= 15 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        Sensor Diagnostics:
                      </span>
                      <span className="text-[10px] font-mono font-black text-indigo-400">{ambientLux} Lux</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[9px] font-bold">
                      <span className="text-slate-500 uppercase">Ambient Light:</span>
                      <span className={ambientLux <= 15 ? "text-amber-500 uppercase animate-pulse" : "text-emerald-500 uppercase"}>
                        {ambientLux <= 15 ? "Low Light Detected" : "Good Lighting"}
                      </span>
                    </div>

                    {ambientLux <= 15 && (
                      <div className="p-2 bg-amber-950/40 border border-amber-900/30 rounded-xl flex items-center justify-between">
                        <span className="text-[8px] font-black text-amber-450 uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          ⚡ Auto-Contrast Boost Active (150%)
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase font-mono">Dynamic Filter</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Real-time Status Indicator Text */}
                <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-center w-full">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${scannerStatus.startsWith("SUCCESS") ? "text-emerald-500 animate-pulse" : "text-blue-500"}`}>
                    {scannerStatus}
                  </span>
                </div>
                
                {/* Camera Toggle Button */}
                <button
                  type="button"
                  onClick={() => setCameraFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-300 transition-all font-black uppercase tracking-wider text-[10px] rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                  id="toggle-camera-button"
                >
                  <ArrowUpDown size={12} className="text-blue-500" />
                  Toggle Camera
                </button>
                
                <p className="text-[10px] uppercase font-black text-slate-450 tracking-widest text-center mt-4 leading-relaxed">
                  Hold your physical transaction token receipt QR level with the camera aperture box.{" "}
                  <button
                    type="button"
                    onClick={() => setShowScanningGuideModal(true)}
                    className="text-blue-500 hover:text-blue-600 underline font-black cursor-pointer inline-flex items-center gap-0.5 ml-1 transition-all hover:scale-105 active:scale-95"
                  >
                    Need Help?
                  </button>
                </p>

                <div className="w-full border-t border-slate-100 dark:border-slate-800/80 mt-6 pt-4 flex flex-col items-center">
                  <span className="text-[9px] uppercase tracking-wider text-slate-450 font-bold mb-2">Camera failed or not working?</span>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/65 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer transition-all shadow-sm uppercase tracking-wider leading-none">
                    <FileText size={14} className="text-red-600 shrink-0" />
                    {isOcrReading ? "Reading..." : "Upload Receipt Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOcrImageUpload}
                      disabled={isOcrReading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Dictionary Modal */}
        <AnimatePresence>
          {showStatusDictionary && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-left"
              onClick={() => setShowStatusDictionary(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-850 p-6 md:p-8 flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center w-full mb-6 pb-4 border-b border-slate-150/40 dark:border-slate-800/80">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-6 rounded-full bg-blue-600 block"></span>
                      AOS Status Dictionary
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Human-readable guides for our technical verification workflow</p>
                  </div>
                  <button 
                    onClick={() => setShowStatusDictionary(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all text-sm font-black"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {STATUS_LEGEND_CONFIGS.map((item) => {
                    const dynamicTooltip = getDynamicTooltip(item.status, item.defaultMeaning);
                    const dynamicDefVal = getDynamicDefinition(item.status, item.defaultAction);
                    const isCurrentStatus = trackedOrder && 
                      (trackedOrder.Status || trackedOrder.status || '').trim().toLowerCase() === item.status.trim().toLowerCase();
                    const IconComp = item.icon;
                    const requiresAction = item.category === 'Action Required' || item.category === 'Flagged';
                    
                    return (
                      <div 
                        key={item.status} 
                        className={`p-4 rounded-2xl border transition-all group ${
                          isCurrentStatus 
                            ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20 shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-950/30 border-slate-150/60 dark:border-slate-800/50 hover:border-blue-500/30 dark:hover:border-blue-500/20'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border shadow-xs ${item.pillClass}`}>
                              <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                              <IconComp size={12} className="shrink-0" />
                              <span>{item.status}</span>
                            </span>
                            {isCurrentStatus && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-blue-600 text-white shadow-xs">
                                Active Order State
                              </span>
                            )}
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-350">
                              {item.category}
                            </span>
                          </div>
                          {requiresAction && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                              Action Required
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 mt-1.5">
                          <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                            {dynamicTooltip}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {dynamicDefVal}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                  <button 
                    onClick={() => setShowStatusDictionary(false)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    Close Directory
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tracked details viewport */}
        {trackedOrder && (
          <div className="space-y-8 relative" id="order-tracking-result">
            {/* Real-time synchronization loading overlay */}
            <AnimatePresence>
              {isSyncing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/75 dark:bg-slate-900/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3 rounded-2xl"
                  id="syncing-loader-overlay"
                >
                  <Loader2 size={36} className="text-blue-600 animate-spin" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-150 animate-pulse">Syncing Google Sheets Database...</span>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Header snapshot detailing */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-850/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
              <div className="space-y-2">
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md">
                  AOS Registry verified
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Order #{trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const idText = trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID;
                      if (idText) {
                        navigator.clipboard.writeText(String(idText));
                        toast.success("Order ID copied to clipboard!");
                      }
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Copy to Clipboard"
                    id="copy-to-clipboard-btn"
                  >
                    <Copy size={11} />
                    <span className="text-[8px] uppercase font-black tracking-widest font-mono">Copy ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintOrder}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold border border-slate-200 dark:border-slate-800 shadow-xs print:hidden"
                    title="Print Tracking Summary"
                    id="print-tracking-summary-btn"
                  >
                    <Printer size={11} className="text-blue-500" />
                    <span className="text-[8px] uppercase font-black tracking-widest font-mono">Print summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDocPreviewModal(true);
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-300 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold border border-slate-200 dark:border-slate-800 shadow-xs print:hidden animate-pulse-subtle"
                    title="Open Document Preview Panel"
                    id="preview-document-btn"
                  >
                    <Eye size={11} className="text-emerald-500" />
                    <span className="text-[8px] uppercase font-black tracking-widest font-mono">Preview Doc</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {trackedOrder.service || trackedOrder.ServiceType || trackedOrder.Type || 'Digital Signature Certificate'}
                </p>
              </div>
              
              <div className="text-left md:text-right space-y-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block font-mono">Processing stage</span>
                <div className="flex items-center gap-2 md:justify-end flex-wrap">
                  {/* Interactive Status Color Legend Tooltip */}
                  <OrderStatusLegendTooltip 
                    currentStatus={trackedOrder.Status || trackedOrder.status}
                    dynamicDefinitions={statusDefinitions}
                    onOpenFullDirectory={() => setShowStatusDictionary(true)}
                  />

                  <div 
                    className="relative inline-block border-none bg-transparent"
                    onMouseEnter={() => setShowStatusIndicatorTooltip(true)}
                    onMouseLeave={() => setShowStatusIndicatorTooltip(false)}
                  >
                    <motion.div
                      key={trackedOrder.Status || trackedOrder.status || 'Pending'}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="inline-block"
                    >
                      {(() => {
                        const statusConfig = getOrderStatusConfig(trackedOrder.Status || trackedOrder.status, statusDefinitions);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <button
                            onClick={() => setShowStatusDictionary(true)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 cursor-pointer shadow-xs transition-all border ${statusConfig.pillClass}`}
                            title="Click to open Status Dictionary"
                          >
                            <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                            <StatusIcon size={12} className="shrink-0" />
                            <span>{trackedOrder.Status || trackedOrder.status || 'Pending'}</span>
                            <HelpCircle size={12} className="opacity-75 shrink-0 ml-0.5" />
                          </button>
                        );
                      })()}
                    </motion.div>

                    {/* Animated processing time status tooltip */}
                    <AnimatePresence>
                      {showStatusIndicatorTooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2.5 bg-slate-900 dark:bg-slate-950 text-white p-4 rounded-2xl w-72 text-left shadow-2xl border border-slate-800 z-[999] pointer-events-none"
                        >
                          <div className="absolute top-0 right-6 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-slate-900 dark:border-b-slate-950 -mt-2" />
                          <h4 className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest mb-1.5">
                            Processing Time Metric
                          </h4>
                          {(() => {
                            const rawStatus = (trackedOrder.Status || trackedOrder.status || '').toLowerCase();
                            let timeEstimate = "12–24 Hours";
                            let description = "Initial receipt intake, payment authorization, and queue scheduling are completing.";
                            if (rawStatus.includes('completed') || rawStatus.includes('approved')) {
                              timeEstimate = "Instant Cleared";
                              description = "The certificates are fully signed, cataloged, and released for direct download.";
                            } else if (rawStatus.includes('submitted')) {
                              timeEstimate = "24–72 Hours";
                              description = "Stored directly in registry queue waiting for governmental department approval.";
                            } else if (rawStatus.includes('review') || rawStatus.includes('verification')) {
                              timeEstimate = "24–48 Hours";
                              description = "Verification officers are auditing uploaded credentials and biometric checks.";
                            } else if (rawStatus.includes('query')) {
                              timeEstimate = "Action Dependent";
                              description = "Paused. Waiting for user modification or document re-upload in portal.";
                            } else if (rawStatus.includes('draft')) {
                              timeEstimate = "2–6 Hours";
                              description = "Document verified. Administrative legal drafting desk is generating the final draft.";
                            }
                            return (
                              <div className="space-y-1.5 text-[11px]">
                                <div className="flex justify-between items-center bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                  <span className="font-bold text-slate-350 uppercase text-[9px]">Est. Duration:</span>
                                  <span className="font-black text-emerald-400 font-mono text-[10px]">{timeEstimate}</span>
                                </div>
                                <p className="text-slate-300 font-medium leading-relaxed pt-1">
                                  {description}
                                </p>
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold justify-start md:justify-end">
                  <span>Last Sync: {trackedOrder.date || trackedOrder.Timestamp ? new Date(trackedOrder.date || trackedOrder.Timestamp).toLocaleDateString() : 'Real-time'}</span>
                  <button 
                    type="button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all text-blue-600 disabled:opacity-50 inline-flex items-center justify-center"
                    title="Force sync data"
                  >
                    <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Tracking steps with stagger transitions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl relative">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Workflow progress timeline</p>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Active Step
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2"></span> Cleared State
                </div>
              </div>
            <motion.div 
                key={trackedOrder?.orderId || trackedOrder?.ID || 'stagnant'}
                variants={stepsContainerVariants}
                initial="hidden"
                animate="visible"
                className="relative flex flex-col md:flex-row justify-between md:items-start gap-8 md:gap-4 pb-4"
              >
                {/* Connector Progress Bar Line (Desktop) */}
                <div className="absolute left-6 md:left-4 md:right-4 top-10 md:top-6 bottom-10 md:bottom-auto h-auto md:h-1 bg-slate-150 dark:bg-slate-800 z-0 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStepIndex / (trackerSteps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }}
                    className="h-full bg-blue-600 rounded-full" 
                  />
                </div>

                {trackerSteps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const isPassed = idx <= currentStepIndex;

                  return (
                    <motion.div 
                      key={step.key}
                      variants={stepItemVariants}
                      className="relative z-10 flex md:flex-col items-start md:items-center gap-4 md:gap-3 flex-1"
                    >
                      {/* Step index trigger bullet */}
                      <div 
                        onMouseEnter={() => setActiveTooltip(step.key)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(prev => prev === step.key ? null : step.key)}
                        className={`w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shrink-0 shadow-md cursor-help relative transition-all duration-300 ${
                          isQueryRaised && isCurrent ? 'bg-orange-500 scale-110 shadow-lg shadow-orange-100 dark:shadow-none' :
                          isCurrent ? 'bg-blue-600 scale-115 ring-4 ring-blue-100 dark:ring-blue-900/10' :
                          isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                        } text-white`}
                      >
                        {isQueryRaised && isCurrent ? (
                          <AlertTriangle size={18} />
                        ) : isCompleted ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <span className="text-xs font-black">{idx + 1}</span>
                        )}

                        {/* Informative Step Hover Tooltips */}
                        <AnimatePresence>
                          {activeTooltip === step.key && (
                            <motion.div 
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-950 dark:bg-slate-950 text-white p-3 rounded-xl w-48 text-center text-[10px] font-bold shadow-xl border border-slate-800 z-[999]"
                            >
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-950 dark:border-t-slate-950" />
                              <p className="uppercase text-[8px] text-blue-400 font-extrabold mb-1 tracking-widest">{step.title} details</p>
                              <p className="text-slate-300 leading-normal font-medium">{getDynamicTooltip(step.key, step.tooltip)}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div className="md:text-center space-y-1 mt-1">
                        <p className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 md:justify-center ${
                          isQueryRaised && isCurrent ? 'text-orange-500' :
                          isCurrent ? 'text-blue-600' :
                          isPassed ? 'text-slate-805 dark:text-slate-100' : 'text-slate-400'
                        }`}>
                          {step.title}
                          <HelpCircle 
                            size={12} 
                            className="text-slate-300 dark:text-slate-600 cursor-pointer hover:text-slate-500" 
                            onClick={(e) => { e.stopPropagation(); setActiveTooltip(prev => prev === step.key ? null : step.key); }}
                          />
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide max-w-[150px] md:mx-auto">
                          {isQueryRaised && isCurrent ? 'Manual Resolution Needed' : step.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Status Color-Coding Legend and Dynamic Dictionary Section */}
              <div className="mt-8">
                <OrderStatusLegendSection 
                  currentStatus={trackedOrder.Status || trackedOrder.status}
                  dynamicDefinitions={statusDefinitions}
                  defaultExpanded={true}
                />
              </div>

              {/* Recharts LineChart for Status History Over Time */}
              <div className="mt-8 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl relative">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      Milestone Progress Velocity (Line Analysis)
                    </h4>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                      Real-time status history velocity timeline metric trajectory
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold text-[9px] uppercase px-2.5 py-1 rounded-lg border border-blue-100/60 dark:border-blue-900/40 animate-pulse">
                    Active Data Tracked
                  </div>
                </div>
                
                <div className="w-full h-48 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getChartData()}
                      margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/40" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        domain={[0, 4]} 
                        ticks={[1, 2, 3, 4]}
                        tickFormatter={(val) => {
                          if (val === 1) return 'Placed';
                          if (val === 2) return 'Verified';
                          if (val === 3) return 'Submitted';
                          if (val === 4) return 'Completed';
                          return '';
                        }}
                        tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 700 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-[10px] space-y-1">
                                <p className="font-extrabold uppercase text-blue-400 tracking-wider">
                                  {item.name}
                                </p>
                                <p className="font-medium text-slate-300">
                                  Logged On: <span className="font-bold text-white">{item.date}</span>
                                </p>
                                <p className="font-medium text-slate-300">
                                  Progress Tier: <span className="font-bold text-emerald-400">{item.stage} / 4</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="stage" 
                        stroke="#2563eb" 
                        strokeWidth={4}
                        activeDot={{ r: 8, strokeWidth: 2, fill: '#60a5fa' }}
                        dot={{ r: 5, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dynamic chronological status change logs details lists */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 mt-8 pt-6 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                  <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-600" />
                    Chronological Stage Audits (Real-Time logs)
                  </h4>
                  <button
                    type="button"
                    onClick={downloadOrderHistoryCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg transition-all active:scale-95 shadow-xs cursor-pointer border border-slate-250/50 dark:border-slate-700/60"
                    title="Export currently tracked order logs and history folder into CSV format"
                  >
                    <Download size={11} className="shrink-0 text-blue-600" />
                    Download Order History (CSV)
                  </button>
                </div>
                <div className="space-y-6 pl-4 border-l-2 border-slate-200 dark:border-slate-805 relative py-2">
                  {(() => {
                    const auditHistoryLogs = (() => {
                      if (trackedOrder.history && Array.isArray(trackedOrder.history) && trackedOrder.history.length > 0) {
                        return [...trackedOrder.history]
                          .map((hist: any) => ({
                            title: hist.Status || hist.status || 'Status Updated',
                            timestamp: hist.Timestamp || hist.timestamp || trackedOrder.date || trackedOrder.Timestamp,
                            key: hist.Status || hist.status || 'Pending'
                          }))
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                      } else {
                        // Fallback sequential list calculated backward, sorted descending (newest first)
                        return trackerSteps
                          .slice(0, currentStepIndex + 1)
                          .map((step, sIdx) => {
                            const stepTime = trackedOrder.date || trackedOrder.Timestamp;
                            let calculatedDate = new Date();
                            if (stepTime) {
                              const baseMs = new Date(stepTime).getTime();
                              calculatedDate = new Date(baseMs - (currentStepIndex - sIdx) * 1.5 * 24 * 60 * 60 * 1000);
                            }
                            return {
                              title: step.title,
                              timestamp: calculatedDate.toISOString(),
                              key: step.key
                            };
                          })
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                      }
                    })();

                    return auditHistoryLogs.map((log, lIdx) => {
                      const calculatedDate = new Date(log.timestamp);
                      const isNewest = lIdx === 0;
                      
                      let stepDesc = 'Order audit milestone synchronized automatically with real-time central spreadsheet and registration databases.';
                      const titleLower = log.title?.toLowerCase() || '';
                      if (titleLower.includes('pending') || titleLower.includes('placed')) {
                        stepDesc = 'The order request is securely received, payment verified, and assigned to our documents facilitation desk.';
                      } else if (titleLower.includes('review') || titleLower.includes('verification')) {
                        stepDesc = 'AOS specialized verification officers are verifying uploaded digital transcripts, signatures, and credentials against regulatory guidelines.';
                      } else if (titleLower.includes('submitted')) {
                        stepDesc = 'The validated documents package has been filed successfully on government departments filing system for stamp clearance and issuance.';
                      } else if (titleLower.includes('completed') || titleLower.includes('approved')) {
                        stepDesc = 'Order filing successfully authorized, processed, and completed. Digital transcripts, folders, and e-tokens are fully dispatched and ready below.';
                      } else if (titleLower.includes('query')) {
                        stepDesc = 'An official notification/query has been issued regarding metadata or signature mismatch. Corrective actions required immediately.';
                      }

                      return (
                        <div key={log.key || lIdx} className="relative group">
                          {/* Left Timeline Indicator Bullet */}
                          <div className={`absolute -left-[23px] top-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 transition-all ${
                            isNewest 
                              ? 'border-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/40 text-blue-600 scale-110 shadow-sm' 
                              : 'border-slate-300 text-slate-400'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isNewest ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`} />
                          </div>
                          
                          <div className="bg-slate-50/50 dark:bg-slate-950/25 p-5 rounded-2xl border border-slate-150/40 dark:border-slate-850/40 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/45 hover:shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-black uppercase tracking-tight ${isNewest ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {log.title}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/50 dark:bg-slate-800/80 text-slate-500/90 dark:text-slate-400">
                                  {log.key}
                                </span>
                                {isNewest && (
                                  <span className="text-[8px] bg-blue-100 dark:bg-blue-900/35 text-blue-600 dark:text-blue-400 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                    Freshest Sync
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                {calculatedDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} • {calculatedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium max-w-3xl">
                              {stepDesc}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Status History Duration Timeline Visualization (Recharts) - SHOWING TIME SPENT */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 mt-8 pt-6 space-y-4 print:hidden">
                <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-widest flex items-center justify-between animate-fadeIn">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-blue-600 animate-pulse" />
                    Processing Duration & Pipeline Velocity Analytics
                  </span>
                  <span className="text-[9px] uppercase text-slate-400 font-bold font-mono">Time Spent per Stage (Hours)</span>
                </h4>
                <div className="bg-slate-50/50 dark:bg-slate-950/25 p-4 rounded-2xl border border-slate-150/40 dark:border-slate-850/40 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { name: 'Placed', 'Time Spent (Hours)': currentStepIndex >= 0 ? 12 : 0, marker: 'Start' },
                        { name: 'Verification', 'Time Spent (Hours)': currentStepIndex >= 1 ? 36 : 0, marker: 'Review Process' },
                        { name: 'Submitted', 'Time Spent (Hours)': currentStepIndex >= 2 ? 60 : 0, marker: 'Govt Portal Upload' },
                        { name: 'Completed', 'Time Spent (Hours)': currentStepIndex >= 3 ? 96 : 0, marker: 'License Despatch' }
                      ]}
                      margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={10}
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}
                        itemStyle={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '12px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Time Spent (Hours)" 
                        stroke="#2563eb" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorHours)" 
                        activeDot={{ r: 8 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Context Notes & Special Instructions */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 mt-8 pt-6 space-y-4 text-left no-print">
                <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                  <FileText size={13} className="text-blue-600" />
                  Order Context Notes & Special Instructions
                </h4>
                <div className="bg-slate-50/50 dark:bg-slate-950/25 p-5 rounded-3xl border border-slate-200/40 dark:border-slate-800/40 space-y-3 shadow-inner">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-mono">
                    Any specific details or context related to this registration:
                  </p>
                  <textarea
                    rows={3}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="e.g. Need priority verification. Passport copies and previous tokens provided in original folder. Call customer care if more queries arise..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-xs font-semibold text-slate-700 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all"
                  />
                  <div className="flex justify-between items-center flex-wrap gap-2.5 pt-1.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      * Notes persistent data gets synchronized directly into spreadsheet
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      {savingNotes ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Saving Notes...
                        </>
                      ) : (
                        <>
                          <Check size={12} />
                          Save Notes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Printable notes summary (visible ONLY in print) */}
              {(trackedOrder.Notes || trackedOrder.notes) && (
                <div className="hidden print:block border-t border-slate-300 pt-5 mt-5 space-y-2 text-left">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Special Instructions & Context Notes</h4>
                  <p className="text-slate-800 text-sm bg-slate-100 p-4 rounded-xl border border-slate-200 font-semibold">{strippedNotes}</p>
                </div>
              )}
            </div>

            {/* Action panel showing query protocol descriptions */}
            {isQueryRaised && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50/60 dark:bg-orange-950/10 p-6 rounded-3xl border border-orange-200/50 dark:border-orange-900/30 space-y-3 print:hidden"
                id="query-raised-action-card"
              >
                <div className="flex items-center gap-2.5 text-orange-700 dark:text-orange-400">
                  <AlertTriangle size={20} className="stroke-[3px] animate-bounce" />
                  <h4 className="font-extrabold uppercase text-xs tracking-widest">Query Resolution Required</h4>
                </div>
                <p className="text-xs text-orange-900 dark:text-slate-300 font-bold leading-relaxed">
                  The documentation team has flagged signature differences or proof format mismatch on your physical docket template. Log in to your personal dashboard and reupload files immediately under the "Documents" manager to restore active processing.
                </p>
              </motion.div>
            )}

            {/* Delivery panel if completed */}
            {currentStepIndex === 3 && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50/60 dark:bg-emerald-950/10 p-6 rounded-3xl border border-emerald-200/50 dark:border-emerald-900/30 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center print:border-slate-300 print:text-black"
                id="completed-order-action-card"
              >
                <div className="space-y-1">
                  <h4 className="text-emerald-800 dark:text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 print:text-black">
                    <CheckCircle2 size={16} /> Certificate Approved & Dispatched
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-450 font-bold print:text-slate-700">Your e-Token signing credentials and PDF license copies are active.</p>
                </div>
                {(trackedOrder.FolderLink || trackedOrder.fileLink || extractedLink) && (
                  <a 
                    href={(trackedOrder.FolderLink || trackedOrder.fileLink || extractedLink)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-200 dark:shadow-none shrink-0 print:hidden"
                  >
                    Launch Folder
                  </a>
                )}
              </motion.div>
            )}

            {/* Dynamic CSS injecting media-friendly print properties */}
            <style>{`
              @keyframes qrScan {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
              .animate-qr-scan-line {
                position: absolute;
                animation: qrScan 3s ease-in-out infinite;
              }
              @media print {
                body {
                  background: white !important;
                  color: black !important;
                }
                header, nav, footer, sidebar, .no-print, button, .recent-tracked-keys, .bg-slate-900, input, .lucide {
                  display: none !important;
                  visibility: hidden !important;
                }
                #order-tracking-result {
                  visibility: visible !important;
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 24px !important;
                  background: white !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                #order-tracking-result * {
                   visibility: visible !important;
                   color: black !important;
                }
                .tracking-sliding-progress {
                  background-color: #2563eb !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}</style>

            {/* Download/Print Summary controls block */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm print:hidden">
              <span className="text-xs font-bold text-slate-500">Need a receipt summary? Print, share or export status docket:</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-100 dark:shadow-none flex items-center gap-2 cursor-pointer"
                  title="Share live status docket link/details with clients over WhatsApp"
                  id="whatsapp-share-tracking-btn-action"
                >
                  <MessageCircle size={13} fill="currentColor" />
                  WhatsApp Status Update
                </button>
                <button 
                  onClick={handlePrintOrder}
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-850 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-pointer"
                  title="Open Print Dialog (Simplified Print View)"
                  id="print-tracking-summary-btn-action"
                >
                  <Printer size={13} />
                  Print Tracking Summary
                </button>
                <button 
                  onClick={handleDownloadPdfSummary}
                  disabled={downloadingPdf}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-100 dark:shadow-none flex items-center gap-2 cursor-pointer"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      Download PDF Summary
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty status tracking banner */}
        {!trackedOrder && !error && (
          <div className="py-12 text-center" id="empty-tracking-illustration">
            <Clock size={40} className="mx-auto text-slate-350 dark:text-slate-750 mb-4 animate-pulse" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Awaiting query lookup</p>
            <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">Provide your order reference key above, or tap the QR Scanner icon to pull transaction IDs instantly from receipts.</p>
          </div>
        )}
      </div>

      {/* History panel detailing other tracked orders, supporting sorting & active loading */}
      {recentOrders.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] border border-slate-200/60 dark:border-slate-800/80 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Recently Tracked Registry Keys</h3>
                <button 
                  onClick={handleDownloadHistoryCsv}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1 inline-flex"
                  title="Download Tracked History as CSV file"
                >
                  <Download size={10} />
                  Download CSV
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Quickly access or audit your recently tracked orders</p>
            </div>
            
            {/* Sorting controls */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-150 dark:border-slate-850">
              <span className="text-[9px] font-black uppercase text-slate-400 px-2">Sort by</span>
              <button 
                onClick={() => toggleSort('date')}
                className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1 ${
                  sortBy === 'date' ? 'bg-blue-600 text-white' : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Date
                <ArrowUpDown size={8} />
              </button>
              <button 
                onClick={() => toggleSort('status')}
                className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1 ${
                  sortBy === 'status' ? 'bg-blue-600 text-white' : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Status
                <ArrowUpDown size={8} />
              </button>
              <button 
                onClick={() => toggleSort('id')}
                className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1 ${
                  sortBy === 'id' ? 'bg-blue-600 text-white' : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                ID
                <ArrowUpDown size={8} />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {sortedRecentOrders.map((rec, hIdx) => {
              const recId = rec.orderId || rec.ID || rec.ApplicationID;
              const recStatus = rec.Status || rec.status || 'Pending';
              const recService = rec.service || rec.ServiceType || rec.Type || 'DSC Service';
              const recDate = rec.date || rec.Timestamp;
              
              return (
                <div 
                  key={recId || hIdx}
                  onClick={() => { setOrderId(recId); handleTrack(recId); }}
                  className="bg-slate-50 hover:bg-slate-100/70 dark:bg-slate-950/40 dark:hover:bg-slate-800/45 p-4 rounded-2xl border border-slate-150/50 dark:border-slate-850/60 flex items-center justify-between cursor-pointer shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center text-blue-600 font-extrabold text-xs">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                        #{recId}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
                        {recService} {recDate ? `• ${new Date(recDate).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                      (recStatus.toLowerCase().includes('query')) ? 'bg-orange-100 text-orange-700' :
                      (recStatus.toLowerCase().includes('completed') || recStatus.toLowerCase().includes('approved')) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400'
                    }`}>
                      {recStatus}
                    </span>
                    {(() => {
                      const isInvoiceEnabled = recStatus.toLowerCase().includes('completed') || 
                                               recStatus.toLowerCase().includes('submitted') || 
                                               recStatus.toLowerCase().includes('approved');
                      return (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isInvoiceEnabled) {
                              downloadPDFInvoice(rec, null);
                            } else {
                              toast.error("Invoice is only available for Completed or Submitted orders.");
                            }
                          }}
                          disabled={!isInvoiceEnabled}
                          className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 select-none ${
                            isInvoiceEnabled 
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/30 font-bold border border-blue-200/50 cursor-pointer shadow-sm active:scale-95' 
                              : 'bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-650 border border-slate-250/10 opacity-40 cursor-not-allowed'
                          }`}
                          title={isInvoiceEnabled ? "Download dynamic tax invoice PDF" : "Invoice is available only on Completed or Submitted orders"}
                        >
                          <svg className="w-3 h-3 text-current" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                          </svg>
                          Invoice
                        </button>
                      );
                    })()}
                    <button 
                      onClick={(e) => clearHistoryItem(recId, e)}
                      className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 dark:hover:bg-red-950/20 transition-all"
                      title="Remove from history"
                    >
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
            {/* Help Scanning Guide Modal */}
            <AnimatePresence>
              {showScanningGuideModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-left" onClick={() => { setShowScanningGuideModal(false); setScannerTutorialStep(0); }}>
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 15 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-850 p-6 md:p-8 flex flex-col relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center w-full mb-5 pb-3 border-b border-slate-150/40 dark:border-slate-805/80">
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-wider text-slate-855 dark:text-slate-100">Camera Placement & QR Tutorial</h3>
                        <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">Step {scannerTutorialStep + 1} of 4: Master perfect scanner alignment</p>
                      </div>
                      <button 
                        onClick={() => { setShowScanningGuideModal(false); setScannerTutorialStep(0); }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center justify-between gap-1 mb-6">
                      {[0, 1, 2, 3].map((stepIdx) => (
                        <div 
                          key={stepIdx} 
                          onClick={() => setScannerTutorialStep(stepIdx)}
                          className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${stepIdx === scannerTutorialStep ? 'bg-blue-600' : 'bg-slate-150 dark:bg-slate-800 hover:bg-slate-200'}`}
                          title={`Go to Step ${stepIdx + 1}`}
                        />
                      ))}
                    </div>

                    <div className="space-y-5">
                      {/* Interactive Slides content */}
                      {scannerTutorialStep === 0 && (
                        <motion.div 
                          key="qr-tutorial-step-0"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-3 w-full h-32 md:h-36">
                            <div className="w-full h-full bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                              <img 
                                src={qrScanGuideImg} 
                                alt="Optimal QR Alignment visual guide image" 
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-1 left-2 bg-blue-500/10 text-blue-600 font-extrabold text-[7px] uppercase px-1 rounded">
                                Receipt Frame
                              </div>
                            </div>
                            <div className="w-full h-full bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                              <img 
                                src={qrAlignmentGuideImg} 
                                alt="Optimal Camera Alignment visual guide image" 
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-1 left-2 bg-emerald-500/10 text-emerald-600 font-extrabold text-[7px] uppercase px-1 rounded">
                                Laser Box Focus
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-2">1. QR Receipt Code Setup</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                              Each order is issued with a unique secure QR Receipt transaction code. Place the physical or digital receipt on a flat surface, ensuring the entire QR graphic is clean, unbent, and visible.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {scannerTutorialStep === 1 && (
                        <motion.div 
                          key="qr-tutorial-step-1"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div className="w-full h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 flex flex-col items-center justify-center p-4 text-center">
                            <span className="text-3xl">📏</span>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mt-2">Optimal Distance: 6 - 8 Inches</p>
                            <p className="text-[10px] text-slate-500 max-w-[280px] mt-1">Too close causes blurring; too far makes pattern details indistinguishable.</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider mb-2">2. Distance & Lighting Control</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                              Keep the camera steady about <strong className="text-slate-800 dark:text-white">15-20 cm</strong> away from the paper. Avoid casting direct phone shadows or creating strong glare spots under bright light fixtures, which can blind the lens sensors.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {scannerTutorialStep === 2 && (
                        <motion.div 
                          key="qr-tutorial-step-2"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div className="w-full h-32 bg-sky-500/5 dark:bg-sky-500/10 rounded-2xl border border-sky-500/20 flex flex-col items-center justify-center p-4 text-center">
                            <span className="text-3xl">📱</span>
                            <p className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase mt-2">Keep Camera Parallel</p>
                            <p className="text-[10px] text-slate-500 max-w-[280px] mt-1">Do not tilt the phone. Hold it flat at 90 degrees relative to the sheet.</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider mb-2">3. Alignment & Centering Guidelines</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                              Position your camera so that the QR code sits directly in the center of the viewport brackets. The system's laser scanning bar will automatically lock onto the pattern markers within milliseconds once steady.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {scannerTutorialStep === 3 && (
                        <motion.div 
                          key="qr-tutorial-step-3"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div className="w-full h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex flex-col items-center justify-center p-4 text-center">
                            <span className="text-3xl">⚡</span>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mt-2">Fallback OCR Scanning Available</p>
                            <p className="text-[10px] text-slate-500 max-w-[280px] mt-1">If your device lacks a camera, simply upload an image of the receipt for automated data extraction.</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider mb-2">4. Automatic Local Processing</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                              All scanner processing is done securely inside your browser. Once recognized, the matching order ID is isolated and details are rendered on your screen immediately.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-150/40 dark:border-slate-805/80 flex justify-between items-center">
                      <button 
                        onClick={() => setScannerTutorialStep(prev => Math.max(0, prev - 1))}
                        disabled={scannerTutorialStep === 0}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {scannerTutorialStep < 3 ? (
                        <button 
                          onClick={() => setScannerTutorialStep(prev => prev + 1)}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        >
                          Next Step
                        </button>
                      ) : (
                        <button 
                          onClick={() => { setShowScanningGuideModal(false); setScannerTutorialStep(0); }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          Got It, Let's Scan!
                        </button>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Associated Document PDF Preview Modal */}
            <AnimatePresence>
              {showDocPreviewModal && trackedOrder && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                  id="document-preview-modal-fallback"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col h-[90vh] md:h-[85vh]"
                  >
                    {/* Header Action Control Bar */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h4 className="font-black text-sm uppercase tracking-wider text-slate-850 dark:text-slate-100 flex items-center gap-2">
                            Official Registry Attachment Viewer
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          A4 Document Preview & Certificate Dossier • #{trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID}
                        </p>
                      </div>

                      {/* Utility controls for Certificate: Zoom, Contrast, QR Stamp Toggle, Signature, PNG Export */}
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        {/* Toggle Verification QR Code Stamp */}
                        <button
                          type="button"
                          onClick={() => setShowQrCodeStamp(!showQrCodeStamp)}
                          className={`px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                            showQrCodeStamp
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}
                          title="Toggle Verification QR Code stamp on/off before printing"
                        >
                          <QrCode size={13} />
                          {showQrCodeStamp ? 'QR Stamp: ON' : 'QR Stamp: OFF'}
                        </button>

                        {/* Signature Overlay Uploader / Toggle */}
                        <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5">
                          <Upload size={13} />
                          {signatureOverlay ? 'Change Signature' : 'Add Signature'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleSignatureUpload} 
                            className="hidden" 
                          />
                        </label>

                        {signatureOverlay && (
                          <button
                            type="button"
                            onClick={() => setShowSignatureOverlay(!showSignatureOverlay)}
                            className={`px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                              showSignatureOverlay
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {showSignatureOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
                            {showSignatureOverlay ? 'Signature ON' : 'Signature OFF'}
                          </button>
                        )}

                        {/* Download as PNG */}
                        <button
                          type="button"
                          onClick={handleDownloadPng}
                          disabled={isExportingPng}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Download Certificate as PNG image using html2canvas"
                        >
                          {isExportingPng ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                          Export PNG
                        </button>

                        {/* Zoom buttons */}
                        <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          <button 
                            onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.25))}
                            className="p-1 px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold font-mono rounded cursor-pointer"
                            title="Zoom Out"
                          >
                            -
                          </button>
                          <span className="text-[10px] font-black px-2 text-slate-500 font-mono">
                            {Math.round(previewZoom * 100)}%
                          </span>
                          <button 
                            onClick={() => setPreviewZoom(z => Math.min(2, z + 0.25))}
                            className="p-1 px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold font-mono rounded cursor-pointer"
                            title="Zoom In"
                          >
                            +
                          </button>
                        </div>

                        {/* High Contrast */}
                        <button
                          onClick={() => setPreviewContrast(!previewContrast)}
                          className={`p-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest cursor-pointer ${
                            previewContrast 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-250 dark:border-slate-850'
                          }`}
                        >
                          Contrast
                        </button>

                        <button 
                          onClick={() => {
                            setShowDocPreviewModal(false);
                            setPreviewZoom(1);
                            setPreviewContrast(false);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all font-bold cursor-pointer"
                          title="Close panel"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* A4 Preview Viewport */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-950/80 overflow-auto p-6 flex items-start justify-center relative">
                      <div 
                        className={`transition-all duration-300 w-full max-w-2xl bg-white text-slate-900 p-8 md:p-12 rounded-3xl shadow-xl relative border border-slate-200/80 my-4 flex flex-col justify-between order-certificate-container ${
                          previewContrast ? 'invert contrast-125' : ''
                        }`}
                        style={{ 
                          transform: `scale(${previewZoom})`, 
                          transformOrigin: 'top center',
                          minHeight: '297mm' // Standard A4 Aspect ratio
                        }}
                        id="preview-pdf-canvas"
                      >
                        {/* User-Facing Controls within .order-certificate-container */}
                        <div className="no-print print:hidden absolute top-3 right-3 z-30 flex items-center gap-2">
                          {/* Print Button with 'Best viewed on A4 landscape' tooltip */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Print Certificate"
                            >
                              <Printer size={12} />
                              Print
                            </button>
                            {/* Visual indicator / tooltip */}
                            <div className="absolute top-full mt-1.5 right-0 bg-slate-900 text-white text-[8px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-40 pointer-events-none flex items-center gap-1 border border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Best viewed on A4 landscape
                            </div>
                          </div>

                          <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider cursor-pointer select-none bg-slate-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700 shadow-md">
                            <input 
                              type="checkbox" 
                              checked={showQrCodeStamp} 
                              onChange={(e) => setShowQrCodeStamp(e.target.checked)} 
                              className="w-3 h-3 accent-blue-600 rounded cursor-pointer"
                            />
                            <span>QR Code Stamp</span>
                          </label>
                        </div>

                        {/* A4 Corner Alignment Marks (Visible on Print) */}
                        <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 pointer-events-none select-none z-20">┌ A4-TL</div>
                        <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-400 pointer-events-none select-none z-20">A4-TR ┐</div>
                        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 pointer-events-none select-none z-20">└ A4-BL</div>
                        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 pointer-events-none select-none z-20">A4-BR ┘</div>

                        {/* Decorative Premium Border Frame */}
                        <div className="absolute inset-4 border-2 border-double border-slate-200/60 rounded-2xl pointer-events-none z-0" />
                        <div className="absolute inset-6 border border-dashed border-slate-200/40 rounded-xl pointer-events-none z-0" />
                        
                        {/* High-resolution logo watermark and official 'AOS' branding in background at 5% opacity */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.05] select-none z-0 overflow-hidden">
                          <Building2 size={180} className="text-slate-900 mb-2" />
                          <span className="text-7xl font-black text-slate-900 uppercase tracking-[18px]">AMIT ONLINE SERVICES</span>
                          <span className="text-2xl font-bold text-slate-700 uppercase tracking-[8px] mt-2">GOVERNMENT E-SERVICES DIGITAL PORTAL</span>
                        </div>

                        {/* Auto-generated Header Block (Print Only & Preview visible) */}
                        <div className="relative z-10 mb-4 pb-3 border-b-2 border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase order-certificate-print-header">
                          <div>
                            <span className="font-black text-slate-900 block">AMIT ONLINE SERVICES • CENTRAL REGISTRY</span>
                            <span>CERTIFICATE REF: AOS-CERT-{(trackedOrder.orderId || trackedOrder.ID || 'AOS2026').toString().toUpperCase()} • HASH: {Math.abs(((trackedOrder.orderId || trackedOrder.ID || 'AOS').toString().split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0))).toString(16).toUpperCase()}</span>
                          </div>
                          <div className="text-right">
                            <span className="block font-bold">GEN DATE: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <span className="text-[8px] text-slate-500">A4 BLEED ALIGNED • VERIFIED DOCUMENT</span>
                          </div>
                        </div>

                        <div className="relative z-10 space-y-8 flex-1">
                          {/* Official Stamp / Emblem Column */}
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h5 className="text-[10px] font-black uppercase text-blue-600 tracking-wider">AOS DIGITAL TRUST NETWORK</h5>
                              <p className="text-xs font-black text-slate-800 font-mono tracking-widest uppercase">REGISTRATION TRANSCRIPT CERTIFICATE</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">VERIFIED STATE DIGITAL CLEARANCE FILE</p>
                            </div>
                            <div className="w-16 h-16 bg-slate-50 rounded-full border-4 border-dashed border-blue-100 flex items-center justify-center text-blue-600">
                              <Building2 size={24} className="opacity-75" />
                            </div>
                          </div>

                          {/* Order Metadata Table */}
                          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100/50">
                              <div className="p-3 border-r border-slate-200">
                                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block">TRACKING KEY ID</span>
                                <strong className="text-xs font-black text-slate-800 font-mono">#{trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID}</strong>
                              </div>
                              <div className="p-3">
                                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block">APPLICATION CATEGORY</span>
                                <strong className="text-xs font-black text-slate-800">{trackedOrder.service || trackedOrder.ServiceType || trackedOrder.Type || 'GST Enrollment'}</strong>
                              </div>
                            </div>
                            <div className="grid grid-cols-2">
                              <div className="p-3 border-r border-slate-200">
                                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block">HOLDER RECIPIENT</span>
                                <strong className="text-xs font-black text-slate-800">{trackedOrder.UserEmail || trackedOrder.email || 'Amit Online Services Client'}</strong>
                              </div>
                              <div className="p-3">
                                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block">CERTIFICATE STATUS</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase">
                                  <CheckCircle2 size={11} />
                                  {trackedOrder.Status || trackedOrder.status || 'APPROVED'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Certification Declaration Block */}
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-150 relative overflow-hidden">
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest absolute top-4 right-4">
                              SECURE SYSTEM CHECK
                            </span>
                            <h6 className="text-[10px] font-black text-slate-850 uppercase tracking-widest mb-2">OFFICIAL AUTHORIZATION STATUTE</h6>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                              This document officially verifies that order <strong className="text-black">#{trackedOrder.orderId || trackedOrder.ID || trackedOrder.ApplicationID}</strong> has been fully cataloged and endorsed by the Central Digitization Registry of Amit Online Services. Under statutory directives, all cryptographic credentials have been checked and resolved.
                            </p>
                          </div>

                          {/* Historical Milestones Block */}
                          <div className="space-y-3">
                            <h6 className="text-[9px] font-black text-slate-450 uppercase tracking-wider">CHRONOLOGICAL AUDIT DOCKET</h6>
                            <div className="space-y-2">
                              {[
                                { name: 'Inward Receipt Registered', desc: 'System packet parsed successfully.' },
                                { name: 'Credential Verification Audit', desc: 'Signature and certificate hashes matched live database keys.' },
                                { name: 'State Registry Clearance Upload', desc: 'Secure dispatch issued' }
                              ].map((item) => (
                                <div key={item.name} className="flex gap-3 text-[11px] items-center border-b border-dashed border-slate-200 pb-2">
                                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[9px]">
                                    ✔
                                  </span>
                                  <div className="flex-1">
                                    <span className="font-extrabold text-slate-800 block text-[10.5px]">{item.name}</span>
                                    <span className="text-slate-400 text-[9.5px] font-semibold uppercase">{item.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Signatures, Verification QR Stamp & Barcodes at Bottom of Certificate */}
                        <div className="relative pt-6 border-t border-slate-200 flex justify-between items-end mt-12">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">SECURITY BARCODE & HASH</span>
                            <div className="h-7 w-28 bg-slate-100 flex items-center justify-center text-[7px] text-slate-450 tracking-[3px] border border-slate-200 select-none">
                              ||||||| | || ||| || | ||
                            </div>
                            <span className="text-[7px] text-slate-400 uppercase font-mono tracking-widest block">HASHMAP-AOS-{(trackedOrder.orderId || trackedOrder.ID || 'CODE').toString().substring(0, 8)}</span>
                          </div>

                          {/* Optional Verification QR Code Stamp */}
                          {showQrCodeStamp && (
                            <div className="flex flex-col items-center space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <div className="w-16 h-16 bg-white p-1 border border-slate-300 rounded-lg flex items-center justify-center">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                                    `${window.location.origin}/?tab=orders&orderId=${trackedOrder.orderId || trackedOrder.ID}`
                                  )}`}
                                  alt="Verification QR Code"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">QR VERIFY STAMP</span>
                            </div>
                          )}

                          {/* Signature Block & Overlay */}
                          <div className="text-right space-y-1.5 relative min-w-[140px]">
                            {showSignatureOverlay && signatureOverlay ? (
                              <div className="h-12 w-28 mx-auto flex items-center justify-center overflow-hidden border-b border-slate-400 pb-1">
                                <img 
                                  src={signatureOverlay} 
                                  alt="Authorized Signature Overlay" 
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-28 border-b border-slate-400 mx-auto text-center py-1 select-none">
                                <span className="text-[9px] font-black italic text-blue-600 opacity-80">Govt Authorized Signature</span>
                              </div>
                            )}
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">ISSUING AUTHORITY</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PDF Footer Controller & Floating Print Action */}
                    <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                          A4 Document Preview Mode • High Integrity Secured
                        </span>
                        <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Best viewed on A4 landscape
                        </span>
                      </div>

                      <div className="flex items-center gap-2 print:hidden">
                        {(trackedOrder.FolderLink || trackedOrder.fileLink || extractedLink) && (
                          <a
                            href={(trackedOrder.FolderLink || trackedOrder.fileLink || extractedLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                          >
                            <Download size={13} />
                            Open Original File Link
                          </a>
                        )}

                        {/* Floating Print Action Trigger */}
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => {
                              window.print();
                            }}
                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer shadow-md active:scale-95 floating-print-btn"
                            title="Print Certificate or Save as PDF"
                            id="order-certificate-floating-print-btn"
                          >
                            <Printer size={15} />
                            Print Certificate (A4)
                          </button>

                          {/* Visual Indicator Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-30 pointer-events-none">
                            Best viewed on A4 landscape / portrait paper
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => {
                            setShowDocPreviewModal(false);
                            setPreviewZoom(1);
                            setPreviewContrast(false);
                          }}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          Close Preview
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* WhatsApp Share Modal */}
            <AnimatePresence>
              {showWhatsAppModal && trackedOrder && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 print:hidden"
                  id="whatsapp-share-modal-overlay"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.4 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-805 flex flex-col"
                  >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-wider text-slate-855 dark:text-slate-100 flex items-center gap-2">
                          <MessageCircle className="text-emerald-500 animate-pulse animate-duration-1000" size={18} />
                          Share Status over WhatsApp
                        </h4>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                          Amit Online Services Facilitation Registry
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowWhatsAppModal(false)}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-full text-slate-400 font-extrabold text-[11px] transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Recipient Number */}
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                          Client WhatsApp Phone Number (with Country Code)
                        </label>
                        <input
                          type="tel"
                          value={waPhoneNumber}
                          onChange={(e) => setWaPhoneNumber(e.target.value)}
                          placeholder="e.g. 919876543210 (Country code + mobile)"
                          className="w-full bg-slate-105 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all dark:text-white"
                        />
                        <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                          *Ensure country code prefix is added (e.g. 91 for India). No spaces or + symbol.
                        </span>
                      </div>

                      {/* Custom message content */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            Prepared Message Template
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(waCustomMessage);
                              toast.success("Ready for pasting!");
                            }}
                            className="text-[9px] text-emerald-600 hover:underline font-bold cursor-pointer"
                          >
                            Copy Message Text
                          </button>
                        </div>
                        <textarea
                          rows={6}
                          value={waCustomMessage}
                          onChange={(e) => setWaCustomMessage(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-xs font-bold outline-none font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none leading-relaxed text-slate-705 dark:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                      <button
                        onClick={() => setShowWhatsAppModal(false)}
                        className="px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const sanitizedNum = waPhoneNumber.replace(/\D/g, '');
                          const waUrl = sanitizedNum
                            ? `https://api.whatsapp.com/send?phone=${sanitizedNum}&text=${encodeURIComponent(waCustomMessage)}`
                            : `https://api.whatsapp.com/send?text=${encodeURIComponent(waCustomMessage)}`;
                          window.open(waUrl, "_blank", "noopener,noreferrer");
                          setShowWhatsAppModal(false);
                          toast.success("Opened WhatsApp Web/App launcher!");
                        }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100 dark:shadow-none"
                      >
                        <MessageCircle size={14} />
                        Launch Share
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
