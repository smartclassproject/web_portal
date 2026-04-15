import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddMaterialModal from '../../components/forms/AddMaterialModal';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../../services/materialService';
import { getSchoolCourses } from '../../services/courseService';
import { toast } from 'react-toastify';
import type { Material, Course } from '../../types';

const TeacherMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsRes, coursesRes] = await Promise.all([
        getMaterials(1, 100),
        getSchoolCourses(1, 100)
      ]);
      setMaterials(materialsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (materialData: {
    courseId: string;
    title: string;
    description?: string;
    fileType: 'pdf' | 'ppt' | 'pptx' | 'video' | 'image' | 'document' | 'other' | 'link';
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    isPublished?: boolean;
  }) => {
    setSubmitLoading(true);
    try {
      if (selectedMaterial) {
        await updateMaterial(selectedMaterial._id, materialData);
        toast.success('Material updated successfully');
      } else {
        await createMaterial(materialData);
        toast.success('Material uploaded successfully');
      }
      setIsModalOpen(false);
      setSelectedMaterial(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving material');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await deleteMaterial(id);
        toast.success('Material deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Error deleting material');
      }
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'video':
        return '🎥';
      case 'image':
        return '🖼️';
      case 'document':
        return '📝';
      case 'link':
        return '🔗';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
          <button
            onClick={() => {
              setSelectedMaterial(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Upload Material
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((material) => {
                const course = typeof material.courseId === 'object' 
                  ? material.courseId 
                  : courses.find(c => c._id === material.courseId);
                return (
                  <tr key={material._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-2xl">
                      {getFileTypeIcon(material.fileType)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {material.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a 
                        href={material.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {material.fileType === 'link'
                          ? 'Open link'
                          : material.fileName || 'View file'}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(material.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        material.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {material.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedMaterial(material);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(material._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AddMaterialModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMaterial(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedMaterial}
          courses={courses}
          isEdit={!!selectedMaterial}
          loading={submitLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default TeacherMaterialsPage;
