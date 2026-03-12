import type { Material } from '../types';
import axiosInstance from './axiosInstance';

export interface CreateMaterialData {
  courseId: string;
  title: string;
  description?: string;
  fileType: 'pdf' | 'ppt' | 'pptx' | 'video' | 'image' | 'document' | 'other';
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  isPublished?: boolean;
}

export interface UpdateMaterialData {
  title?: string;
  description?: string;
  fileType?: 'pdf' | 'ppt' | 'pptx' | 'video' | 'image' | 'document' | 'other';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isPublished?: boolean;
}

export interface MaterialResponse {
  data: Material[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Get materials with pagination and filters
export const getMaterials = async (
  page = 1,
  limit = 10,
  courseId?: string,
  fileType?: string,
  isPublished?: boolean
): Promise<MaterialResponse> => {
  try {
    let url = `/api/materials?page=${page}&limit=${limit}`;
    
    if (courseId) {
      url += `&courseId=${courseId}`;
    }
    
    if (fileType) {
      url += `&fileType=${fileType}`;
    }
    
    if (isPublished !== undefined) {
      url += `&isPublished=${isPublished}`;
    }
    
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching materials:', error);
    throw error;
  }
};

// Get material by ID
export const getMaterialById = async (id: string): Promise<Material> => {
  try {
    const response = await axiosInstance.get(`/api/materials/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching material:', error);
    throw error;
  }
};

// Create a new material
export const createMaterial = async (materialData: CreateMaterialData): Promise<Material> => {
  try {
    const response = await axiosInstance.post('/api/materials', materialData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating material:', error);
    throw error;
  }
};

// Update a material
export const updateMaterial = async (id: string, materialData: UpdateMaterialData): Promise<Material> => {
  try {
    const response = await axiosInstance.put(`/api/materials/${id}`, materialData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating material:', error);
    throw error;
  }
};

// Delete a material
export const deleteMaterial = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/materials/${id}`);
  } catch (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
};
