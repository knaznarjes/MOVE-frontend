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

// Content microservice models
export enum ContentType {
  TRAVEL_STORY = 'TravelStory',
  ITINERARY = 'Itinerary'
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
  mediaType?: string; // "COVER", "ALBUM"
  displayOrder?: number;
  uploadDate?: Date;
  contentId?: string;
}

export interface ActivityPoint {
  id?: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  cost: number;
  category: string;
  difficulty: string;
  contactInfo: string;
  itineraryDayId?: string;
  location: Location;
}

export interface DayProgram {
  id?: string;
  dayNumber: number;
  description: string;
  contentId?: string;
  activities: ActivityPoint[]; // Non-optional to match backend getter
}

export interface Content {
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
  media: Media[]; // Non-optional to match backend getter
  locations: Location[]; // Non-optional to match backend getter
  dayPrograms: DayProgram[]; // Non-optional to match backend getter
}
