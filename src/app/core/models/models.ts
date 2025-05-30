/* eslint-disable @typescript-eslint/naming-convention */

// Authentication microservice models
export enum Role {
  ADMIN = 'ADMIN',
  TRAVELER = 'TRAVELER',
  MASTERADMIN = 'MASTERADMIN'
}

export interface Account {
  id?: string;
  email: string;
  password?: string;
  userId?: string;
}

export interface Preference {
  id?: string;
  category: string;
  priority: string;
  userId?: string;
}

export interface User {
  id?: string;
  creationDate?: Date;
  modifiedAt?: Date;
  role: Role;
  fullName: string;
  photoProfile?: string;
  accountId?: string;
  preferences: Preference[];  // Non optional, matching backend getter that ensures non-null
  accountLocked: boolean;     // Default value in backend is false
  enabled: boolean;           // Default value in backend is true
}

export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  role: Role;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: Role;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AccountDTO {
  id?: string;
  email: string;
  password?: string;
}

export interface PreferenceDTO {
  id?: string;
  userId?: string;
  category: string;
  priority: string;
}

export interface UserDTO {
  id?: string;
  fullName: string;
  creationDate?: Date;
  modifiedAt?: Date;
  photoProfile?: string;
  preferences?: PreferenceDTO[];
  account?: AccountDTO;
  role: Role;
  accountLocked?: boolean;
  enabled?: boolean;
  email?: string;
}

export enum ContentType {
  TRAVEL_STORY = 'TRAVEL_STORY',
  ITINERARY = 'ITINERARY',
}

export interface Location {
  id?: string;
  address: string;
  country: string;
  lat?: number;
  lon?: number;
}


export interface Media {
  id?: string;
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
  fileName: string;
  thumbnailName?: string;   // Miniature (nom du fichier)
  mediaType?: string;       // "COVER", "ALBUM", "VIDEO"
  displayOrder?: number;
  uploadDate?: Date;
  contentId?: string;
}

export interface ActivityPoint {
  id?: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  difficulty: string;
  contactInfo: string;
  dayProgramId?: string;     // Mise à jour ici (anciennement itineraryDayId)
  location: Location;
}

export interface DayProgram {
  id?: string;
  dayNumber: number;
  description: string;
  contentId?: string;
  activities: ActivityPoint[]; // Non-optional pour correspondre au getter Java
}

export interface Content {
  averageRating: number; // garde ça comme double/moyenne
  id?: string;
  title: string;
  description: string;
  creationDate?: Date;
  lastModified?: Date;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  isPublished?: boolean;
  rating?: number;
  likeCount?: number;
  tags?: string;
  duration?: number;
  type: ContentType;
  userId?: string;
  coverImageId?: string;
  media: Media[];
  locations: Location[];
  dayPrograms: DayProgram[];

}
//search service
export interface ContentIndex {
  averageRating: number;
  id?: string;
  title: string;
  description: string;
  budget?: number;
  rating?: number;
  userId?: string;
  type: ContentType;
  creationDate?: Date;
  lastModified?: Date;
  isPublished?: boolean;
    likeCount?: number;

}

export interface SearchResult<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AdvancedSearchParams {
  keyword?: string;
  minBudget?: number;
  maxBudget?: number;
  minRating?: number;
  type?: string; // Modifié de ContentType à string pour correspondre au backend
  isPublished?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}
export interface SearchHistory {
  id?: string;
  userId: string;
  keyword: string;
  timestamp: Date;
}
export type MediaType = 'COVER' | 'ALBUM' | 'VIDEO';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  budget?: number;
  rating?: number;
  tags?: string;
  type?: ContentType;
  userId?: string;
  likeCount?: number;
  averageRating?: number;
}
export interface ContentFavorisDTO {
  id: string;
  userId: string;
  contentId: string;
  dateAdded: string;
}
// models/notification.model.ts

export interface Notification {
  fromUserName: any;
  senderName: any;
  timestamp: string | number | Date;
  id?: string;
  userId: string;
  message: string;
  type: string; // COMMENT, LIKE, FOLLOW, etc.
  sourceId?: string;
  sourceName?: string;
  read: boolean;
  createdAt?: string;
  readAt?: string;
  metadata?: string; // format JSON.stringify({ ... })
  priority?: number; // 0 = basse, 1 = normale, 2 = haute
}


export interface Comment {
  id?: string;
  contentId: string;
  userId: string;
  contentOwnerId: string; // ✅ Ajouté pour refléter le backend
  message: string;
  createdAt?: string;     // LocalDateTime devient string en JSON
  updatedAt?: string;
  deleted?: boolean;
  valid?: boolean;        // Optionnel, si utilisé dans la logique de validation frontend
}


