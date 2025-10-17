// Modèle complet (retourné par l'API)
export interface Association {
  id: string;
  name: string;
  description?: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;  // ISO 8601 string
  updatedAt: string;  // ISO 8601 string
}

// Modèle pour création/mise à jour (sans id, createdAt, updatedAt)
export interface AssociationCreateUpdate {
  name: string;
  description?: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  isActive?: boolean;
}

// Statistiques
export interface AssociationStats {
  users: {
    total: number;
    active: number;
  };
  actions: {
    total: number;
    completed: number;
    planned: number;
    in_progress: number;
  };
}

// Réponse API liste
export interface AssociationsResponse {
  associations: Association[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Réponse API détail
export interface AssociationDetailResponse {
  association: Association & {
    users?: Array<{
      id: string;
      firstName: string;
      lastName: string;
      role: string;
      isActive: boolean;
    }>;
    maraudeActions?: Array<{
      id: string;
      title: string;
      scheduledDate: string;
      status: string;
    }>;
  };
}
