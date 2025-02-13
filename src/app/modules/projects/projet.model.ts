export interface Tache {
    id?: string;
    description?: string;
    dateDebut?: Date;
    dateFin?: Date;
    status?: string;
    versionId?: string;
    personnelIds?: string[];
  }

  export interface VersionProjet {
    id?: string;
    numeroVersion?: string;
    dateDebut?: Date;
    dateFin?: Date;
    technologies?: string[];
    projetId?: string;
    tacheIds?: string[];
  }

  export interface Projet {
    id?: string;
    nom?: string;
    description?: string;
    dateDebut?: Date;
    dateLimite?: Date;
    status?: string;
    versionIds?: string[];
    personnelIds?: string[];
  }
  export interface Personnel {
    id?: string;
    nom?: string;
    competences?: string[];
    disponibilite?: boolean;
    tacheIds?: string[];
    projetIds?: string[];
    role?: string;
  }
