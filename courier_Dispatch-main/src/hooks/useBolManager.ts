import { create } from 'zustand';
import { Load, LoadDocument } from '@/components/loads/LoadsTable';

export interface BOLDocument extends LoadDocument {
  scannedVin?: string;
}

export interface InvoiceDocument extends LoadDocument {
  invoiceUrl?: string;
}

export interface VCRDocument extends LoadDocument {
  shipperName?: string;
  inspectionDate?: string;
  damageNotes?: string[];
}

interface DocumentManagerState {
  localDocuments: Record<string, (BOLDocument | InvoiceDocument | VCRDocument)[]>;
  addBol: (loadId: string, scannedVin: string, loadCode: string) => void;
  deleteBol: (loadId: string) => void;
  getBolForLoad: (loadId: string) => BOLDocument | undefined;
  getDocsForLoad: (loadId: string) => (BOLDocument | InvoiceDocument | VCRDocument)[];
  addInvoice: (loadId: string, loadCode: string, invoiceUrl: string) => void;
  deleteInvoice: (loadId: string) => void;
  getInvoiceForLoad: (loadId: string) => InvoiceDocument | undefined;
  addVcr: (loadId: string, loadCode: string, shipperName: string, damageNotes?: string[]) => void;
  deleteVcr: (loadId: string) => void;
  getVcrForLoad: (loadId: string) => VCRDocument | undefined;
}

export const useBolManager = create<DocumentManagerState>((set, get) => ({
  localDocuments: {},
  
  addBol: (loadId: string, scannedVin: string, loadCode: string) => {
    const newDocument: BOLDocument = {
      type: "bol",
      url: "",
      name: `BOL-${loadCode}-${scannedVin.slice(-6)}`,
      scannedVin: scannedVin,
    };
    
    set((state) => ({
      localDocuments: {
        ...state.localDocuments,
        [loadId]: [
          ...(state.localDocuments[loadId]?.filter(d => d.type !== "bol") || []),
          newDocument,
        ],
      },
    }));
  },
  
  deleteBol: (loadId: string) => {
    set((state) => ({
      localDocuments: {
        ...state.localDocuments,
        [loadId]: state.localDocuments[loadId]?.filter(d => d.type !== "bol") || [],
      },
    }));
  },
  
  getBolForLoad: (loadId: string) => {
    return get().localDocuments[loadId]?.find(d => d.type === "bol") as BOLDocument | undefined;
  },
  
  getDocsForLoad: (loadId: string) => {
    return get().localDocuments[loadId] || [];
  },

  addInvoice: (loadId: string, loadCode: string, invoiceUrl: string) => {
    const newDocument: InvoiceDocument = {
      type: "invoice",
      url: invoiceUrl,
      name: `INV-${loadCode}-${Date.now().toString().slice(-6)}`,
      invoiceUrl: invoiceUrl,
    };
    
    set((state) => ({
      localDocuments: {
        ...state.localDocuments,
        [loadId]: [
          ...(state.localDocuments[loadId]?.filter(d => d.type !== "invoice") || []),
          newDocument,
        ],
      },
    }));
  },

  deleteInvoice: (loadId: string) => {
    set((state) => ({
      localDocuments: {
        ...state.localDocuments,
        [loadId]: state.localDocuments[loadId]?.filter(d => d.type !== "invoice") || [],
      },
    }));
  },

  getInvoiceForLoad: (loadId: string) => {
    return get().localDocuments[loadId]?.find(d => d.type === "invoice") as InvoiceDocument | undefined;
  },

  addVcr: (loadId: string, loadCode: string, shipperName: string, damageNotes?: string[]) => {
    const newDocument: VCRDocument = {
      type: "vcr",
      url: "",
      name: `VCR-${loadCode}-${Date.now().toString().slice(-6)}`,
      shipperName: shipperName,
      inspectionDate: new Date().toLocaleDateString(),
      damageNotes: damageNotes || [],
    };
    
    set((state) => ({
      localDocuments: {
        ...state.localDocuments,
        [loadId]: [
          ...(state.localDocuments[loadId]?.filter(d => d.type !== "vcr") || []),
          newDocument,
        ],
      },
    }));
  },

  deleteVcr: (loadId: string) => {
    set((state) => ({
      localDocuments: {
        ...state.localDocuments,
        [loadId]: state.localDocuments[loadId]?.filter(d => d.type !== "vcr") || [],
      },
    }));
  },

  getVcrForLoad: (loadId: string) => {
    return get().localDocuments[loadId]?.find(d => d.type === "vcr") as VCRDocument | undefined;
  },
}));

// Helper to find load by VIN
export const findLoadByVin = (loads: Load[], vin: string): Load | undefined => {
  return loads.find(load => 
    load.vehicleInfo.vin.toLowerCase() === vin.toLowerCase()
  );
};
