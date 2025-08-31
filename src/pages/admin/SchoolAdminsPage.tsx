/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getSchoolAdmins, createAdmin, updateAdmin, deleteAdmin, resendSetupEmail, createPasswordForAdmin } from '../../services/adminService';
import { getSchools } from '../../services/schoolService';
import type { AdminUser, School } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const SchoolAdminsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [adminToToggle, setAdminToToggle] = useState<AdminUser | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isCreatePasswordModalOpen, setIsCreatePasswordModalOpen] = useState(false);
  const [adminToCreatePassword, setAdminToCreatePassword] = useState<AdminUser | null>(null);
  const [createPasswordLoading, setCreatePasswordLoading] = useState(false);
  const [isResendEmailModalOpen, setIsResendEmailModalOpen] = useState(false);
  const [adminToResendEmail, setAdminToResendEmail] = useState<AdminUser | null>(null);
  const [resendEmailLoading, setResendEmailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string, confirmPassword?: string }>({});
  const [addLoading, setAddLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [formData, setFormData] = useState<AdminUser>({
    _id: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'school_admin',
    schoolId: '',
    isActive: true,
    lastLogin: '',
    createdAt: '',
    updatedAt: ''
  });
  const [errors, setErrors] = useState<any>({});

  const fetchSchools = async () => {
    setSchoolsLoading(true);
    try {
      const res = await getSchools();
      setSchools(res.data || []);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
      toast.error('Failed to load schools');
    } finally {
      setSchoolsLoading(false);
    }
  };

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    getSchoolAdmins(page, limit)
      .then(res => {
        setAdmins(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.log("fetch admins", err);
        
        const errorMessage = 'Failed to fetch admins';
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      });
  }, [page, limit]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for status field to update isActive
    if (name === 'status') {
      setFormData(prev => ({ ...prev, isActive: value === 'active' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.email.trim()) newErrors.email = 'Email required';
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone required';
    if (!formData.schoolId) newErrors.schoolId = 'School required';
    if (formData.isActive === undefined) newErrors.status = 'Status required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setAddLoading(true);
      setError(null);
      try {
        await createAdmin({
          email: formData.email,
          role: formData.role,
          schoolId: formData.schoolId as string || '',
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          phone: formData.phone || '',
        });

        toast.success('Admin created successfully! A password setup link has been sent to their email.');

        // Refresh the list
        const res = await getSchoolAdmins(page, limit);
        setAdmins(res.data || []);

        setFormData({
          _id: '',
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          role: 'school_admin',
          schoolId: '',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        });
        setErrors({});
        setIsAddOpen(false);
      } catch (err) {
        setError('Failed to create admin');
        toast.error('Failed to create admin');
      } finally {
        setAddLoading(false);
      }
    }
  };

  const handleEditClick = async (admin: AdminUser) => {
    // Prevent editing the current user
    if (admin._id === currentUser?.id) {
      toast.error('You cannot edit yourself from this page');
      return;
    }
    // remove all erros
    setErrors({});
    await fetchSchools();
    setSelectedAdmin(admin);
    setFormData({
      ...admin,
      password: '',
      firstName: admin.name?.split(' ')[0] || '',
      lastName: admin.name?.split(' ')[1] || '',
      schoolId: (admin?.schoolId as School)?._id || ''
    });
    setIsEditOpen(true);
  };

  const handleDeactivate = (admin: AdminUser) => {
    // Prevent deactivating the current user
    if (admin._id === currentUser?.id) {
      toast.error('You cannot deactivate yourself');
      return;
    }
    setAdminToToggle(admin);
    setIsConfirmModalOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!adminToToggle) return;

    setToggleLoading(true);
    try {
      await updateAdmin(adminToToggle._id, {
        email: adminToToggle.email,
        firstName: adminToToggle.firstName || '',
        lastName: adminToToggle.lastName || '',
        phone: adminToToggle.phone || '',
        role: adminToToggle.role,
        schoolId: (adminToToggle.schoolId as School)?._id || '',
        isActive: !adminToToggle.isActive,
      });

      setAdmins(prev => prev.map(a => a._id === adminToToggle._id ? { ...a, isActive: !a.isActive } : a));
      toast.success(`Admin ${adminToToggle.isActive ? 'deactivated' : 'activated'} successfully`);
      setIsConfirmModalOpen(false);
      setAdminToToggle(null);
    } catch (err) {
      toast.error(`Failed to ${adminToToggle.isActive ? 'deactivate' : 'activate'} admin`);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleDelete = (admin: AdminUser) => {
    // Prevent deleting the current user
    if (admin._id === currentUser?.id) {
      toast.error('You cannot delete yourself');
      return;
    }
    setAdminToDelete(admin);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteAdmin(adminToDelete._id);
      setAdmins(prev => prev.filter(a => a._id !== adminToDelete._id));
      toast.success('Admin deleted successfully');
      setIsDeleteModalOpen(false);
      setAdminToDelete(null);
    } catch (err) {
      toast.error('Failed to delete admin');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResendEmail = (admin: AdminUser) => {
    setAdminToResendEmail(admin);
    setIsResendEmailModalOpen(true);
  };

  const confirmResendEmail = async () => {
    if (!adminToResendEmail) return;
    
    setResendEmailLoading(true);
    try {
      await resendSetupEmail(adminToResendEmail.email);
      toast.success('Setup email resent successfully');
      setIsResendEmailModalOpen(false);
      setAdminToResendEmail(null);
    } catch (err) {
      toast.error('Failed to resend setup email');
    } finally {
      setResendEmailLoading(false);
    }
  };

  const handleCreatePassword = (admin: AdminUser) => {
    setAdminToCreatePassword(admin);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
    setIsCreatePasswordModalOpen(true);
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: { password?: string, confirmPassword?: string } = {};

    if (!newPassword.trim()) {
      newErrors.password = 'Password is required';
    } else if (newPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const confirmCreatePassword = async () => {
    if (!adminToCreatePassword || !validatePasswordForm()) return;

    setCreatePasswordLoading(true);
    try {
      await createPasswordForAdmin(adminToCreatePassword._id, newPassword);
      toast.success('Password created successfully');
      setIsCreatePasswordModalOpen(false);
      setAdminToCreatePassword(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (err) {
      toast.error('Failed to create password');
    } finally {
      setCreatePasswordLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    console.log(selectedAdmin);
    e.preventDefault();
    if (validate() && formData._id && formData.email && formData.firstName && formData.lastName && formData.phone && formData.role) {
      setAddLoading(true);
      setError(null);
      try {
        await updateAdmin(formData._id, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
          schoolId: formData.schoolId as string,
          isActive: formData.isActive,
        });

        toast.success('Admin updated successfully');

        // Refresh the list
        const res = await getSchoolAdmins(page, limit);
        setAdmins(res.data || []);

        setIsEditOpen(false);
        setSelectedAdmin(null);
        setFormData({
          _id: '',
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          role: 'school_admin',
          schoolId: '',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        });
        setErrors({});
      } catch (err) {
        setError('Failed to update admin');
        toast.error('Failed to update admin');
      } finally {
        setAddLoading(false);
      }
    }
  };

  const filteredAdmins = admins.filter(admin => {
    // Filter out the current logged-in user
    if (admin._id === currentUser?.id) {
      return false;
    }

    const matchesSearch = admin.email?.toLowerCase().includes(search.toLowerCase()) ||
      admin.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      admin.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      admin.phone?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = isActiveFilter === 'all' || 
      (isActiveFilter === 'active' && admin.isActive) || 
      (isActiveFilter === 'inactive' && !admin.isActive);
    return matchesSearch && matchesStatus;
  });

  const paginatedAdmins = filteredAdmins;
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('School Admins Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    (doc as any).autoTable({
      head: [['Email', 'Name', 'Phone', 'Role', 'Activated', 'Status', 'Last Login']],
      body: filteredAdmins.map(admin => [
        admin.email,
        `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
        admin.phone,
        admin.role,
        admin.passwordSetup ? 'Yes' : 'No',
        admin.isActive ? 'Active' : 'Inactive',
        admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : '-'
      ]),
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] }
    });

    doc.save('school-admins-report.pdf');
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#f7f8fa] py-10 px-2">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading school admins...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f7f8fa] py-10 px-2">
        {/* <div className="space-y-8 max-w-6xl mx-auto"> */}
        {/* <div className="max-w-5xl mx-auto space-y-8"> */}
        <div className="space-y-8 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h1 className="text-2xl font-bold text-gray-900">School Admins</h1>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow flex items-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                await fetchSchools();
                setIsAddOpen(true);
              }}
              disabled={schoolsLoading}
            >
              {schoolsLoading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              )}
              {schoolsLoading ? 'Loading...' : 'Add Admin'}
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <input
              type="text"
              placeholder="Search admins..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full md:w-80 px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white shadow-sm text-base"
            />
            <button onClick={handleDownloadPDF} className="bg-green-100 hover:bg-green-200 text-green-700 px-6 py-3 rounded-lg font-semibold shadow flex items-center gap-2 text-base mt-2 md:mt-0">
              Download PDF
            </button>
          </div>
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading admins...</p>
            </div>
          )}

          {/* Show no data image when no admins */}
          {!loading && paginatedAdmins.length === 0 && (
            <div className="text-center py-12">
              <img
                src="/no_data.jpg"
                alt="No data available"
                className="mx-auto w-64 h-64 object-contain mb-4"
              />
              <p className="text-gray-500 text-lg">No other school admins found</p>
              <p className="text-gray-400 text-sm mt-2">
                {currentUser ? `You are the only admin. Add more admins to see them here.` : 'Try adjusting your search or add a new admin'}
              </p>
            </div>
          )}

          {/* Show table only when there are admins */}
          {!loading && paginatedAdmins.length > 0 && (
            <>

              <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
                      <th className="py-3 px-4 font-semibold text-sm">Email</th>
                      <th className="py-3 px-4 font-semibold text-sm">Name</th>
                      <th className="py-3 px-4 font-semibold text-sm">Phone</th>
                      <th className="py-3 px-4 font-semibold text-sm">Role</th>
                      <th className="py-3 px-4 font-semibold text-sm">Activated</th>
                      <th className="py-3 px-4 font-semibold text-sm">Status</th>
                      <th className="py-3 px-4 font-semibold text-sm">School</th>
                      <th className="py-3 px-4 font-semibold text-sm">Account</th>
                      {/* <th className="py-3 px-4 font-semibold text-sm">Password</th> */}
                      <th className="py-3 px-4 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAdmins.map((admin) => (
                      <tr key={admin._id} className="group border-b last:border-b-0 border-gray-100 hover:bg-green-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900 text-sm">{admin.email}</td>
                        <td className="py-3 px-4 text-gray-700 text-sm">{admin.name || ''}</td>
                        <td className="py-3 px-4 text-gray-700 text-sm">{admin.phone}</td>
                        <td className="py-3 px-4 text-gray-700 text-sm">{admin.role}</td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.passwordSetup
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {admin.passwordSetup ? 'Activated' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            admin.isActive 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          {(admin.schoolId as School)?.name || "-"}
                        </td>
                                                 <td className="py-3 px-4">
                           {!admin.passwordSetup && (
                             <div className="flex flex-col gap-2">
                               <button 
                                 className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-lg hover:bg-purple-200 hover:border-purple-300 transition-all duration-200 shadow-sm"
                                 onClick={() => handleResendEmail(admin)}
                               >
                                 <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                 </svg>
                                 Resend Email
                               </button>
                               <button 
                                 className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-lg hover:bg-orange-200 hover:border-orange-300 transition-all duration-200 shadow-sm"
                                 onClick={() => handleCreatePassword(admin)}
                               >
                                 <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                 </svg>
                                 Create Password
                               </button>
                             </div>
                           )}
                         </td>

                        {/* <td className="py-3 px-4 text-gray-700 text-sm">{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : '-'}</td> */}
                                                 <td className="py-3 px-4">
                           <div className="flex flex-col gap-2">
                             <button 
                               className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm"
                               onClick={() => handleEditClick(admin)}
                             >
                               <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                               </svg>
                               Edit
                             </button>
                             <button 
                               className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 hover:border-red-300 transition-all duration-200 shadow-sm"
                               onClick={() => handleDelete(admin)}
                             >
                               <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                               Delete
                             </button>
                             <button 
                               className={`inline-flex items-center px-3 py-1.5 text-xs font-medium border rounded-lg transition-all duration-200 shadow-sm ${
                                 admin.isActive 
                                   ? 'text-red-700 bg-red-100 border-red-200 hover:bg-red-200 hover:border-red-300' 
                                   : 'text-green-700 bg-green-100 border-green-200 hover:bg-green-200 hover:border-green-300'
                               }`}
                               onClick={() => handleDeactivate(admin)}
                               disabled={toggleLoading && adminToToggle?._id === admin._id}
                             >
                               {toggleLoading && adminToToggle?._id === admin._id ? (
                                 <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1.5"></span>
                               ) : (
                                 <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                                 </svg>
                               )}
                               {toggleLoading && adminToToggle?._id === admin._id 
                                 ? (admin.isActive ? 'Deactivating...' : 'Activating...') 
                                 : (admin.isActive ? 'Deactivate' : 'Activate')
                               }
                             </button>
                           </div>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Show pagination only when there are admins */}
          {!loading && !error && paginatedAdmins.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 text-base"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 text-base"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New School Admin" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., admin@school.edu" />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> A password setup link will be sent to the admin's email address.
                    The admin will need to click the link to set their password.
                  </p>
                </div>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter first name" />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter last name" />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., +1234567890" />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select id="status" name="status" value={formData.isActive ? 'active' : 'inactive'} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.status ? 'border-red-500' : 'border-gray-300'}`} >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select id="role" name="role" value={formData.role} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.role ? 'border-red-500' : 'border-gray-300'}`} >
                    <option value="school_admin">School Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                </div>
                <div>
                  <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">Assign School *</label>
                  <select id="schoolId" name="schoolId" value={formData.schoolId as string} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.schoolId ? 'border-red-500' : 'border-gray-300'}`} >
                    <option value="">Select a school</option>
                    {schools.map((school: School) => (
                      <option key={school._id} value={school._id}>{school.name}</option>
                    ))}
                  </select>
                  {errors.schoolId && <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors" disabled={addLoading}>
                  {addLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Adding...
                    </span>
                  ) : 'Add Admin'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Edit Admin Modal */}
          <Modal isOpen={isEditOpen} onClose={() => {
            setIsEditOpen(false);
            setErrors({});
          }} title="Edit School Admin" size="md">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., admin@school.edu" />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'}`} placeholder="Create password" />
                  <p className="mt-1 text-gray-500" style={{ fontSize: '10px' }}>Password must be at least 4 characters long</p>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter first name" />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter last name" />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., +1234567890" />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select id="status" name="status" value={formData.isActive ? 'active' : 'inactive'} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.status ? 'border-red-500' : 'border-gray-300'}`} >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select id="role" name="role" value={formData.role} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.role ? 'border-red-500' : 'border-gray-300'}`} >
                    <option value="school_admin">School Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                </div>
                <div>
                  <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">Assign School *</label>
                  <select id="schoolId" name="schoolId" value={formData.schoolId as string} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.schoolId ? 'border-red-500' : 'border-gray-300'}`} >
                    <option value="">Select school</option>
                    {schools.map((school: School) => (
                      <option key={school._id} value={school._id}>{school.name}</option>
                    ))}
                  </select>
                  {errors.schoolId && <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors" disabled={addLoading}>
                  {addLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Updating...
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Confirmation Modal */}
          <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title={adminToToggle?.isActive ? 'Deactivate Admin' : 'Activate Admin'} size="sm">
            <div className="space-y-6">
              <p className="text-gray-700">Are you sure you want to {adminToToggle?.isActive ? 'deactivate' : 'activate'} <span className="font-bold">{adminToToggle?.firstName} {adminToToggle?.lastName}</span>?</p>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                <button 
                  type="button" 
                  onClick={confirmDeactivate} 
                  disabled={toggleLoading}
                  className={`px-4 py-2 ${adminToToggle?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  {toggleLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      {adminToToggle?.isActive ? 'Deactivating...' : 'Activating...'}
                    </>
                  ) : (
                    adminToToggle?.isActive ? 'Deactivate' : 'Activate'
                  )}
                </button>
              </div>
            </div>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Admin" size="sm">
            <div className="space-y-6">
              <p className="text-gray-700">Are you sure you want to delete <span className="font-bold">{adminToDelete?.firstName} {adminToDelete?.lastName}</span>? This action cannot be undone.</p>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} disabled={deleteLoading} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                <button type="button" onClick={confirmDelete} disabled={deleteLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {deleteLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </Modal>

          {/* Create Password Modal */}
          <Modal isOpen={isCreatePasswordModalOpen} onClose={() => setIsCreatePasswordModalOpen(false)} title="Create Password for Admin" size="md">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> This will create a password for <span className="font-bold">{adminToCreatePassword?.firstName} {adminToCreatePassword?.lastName}</span> ({adminToCreatePassword?.email}).
                  They will be able to log in immediately with this password.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${passwordErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter new password"
                  />
                  {passwordErrors.password && <p className="mt-1 text-sm text-red-600">{passwordErrors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreatePasswordModalOpen(false)}
                  disabled={createPasswordLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                                <button 
                  type="button" 
                  onClick={confirmCreatePassword} 
                  disabled={createPasswordLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createPasswordLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Create Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>

          {/* Resend Email Modal */}
          <Modal isOpen={isResendEmailModalOpen} onClose={() => setIsResendEmailModalOpen(false)} title="Resend Setup Email" size="sm">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> This will resend the password setup email to <span className="font-bold">{adminToResendEmail?.firstName} {adminToResendEmail?.lastName}</span> ({adminToResendEmail?.email}).
                </p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  Are you sure you want to resend the setup email? The admin will receive a new password setup link.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsResendEmailModalOpen(false)} 
                  disabled={resendEmailLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={confirmResendEmail} 
                  disabled={resendEmailLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {resendEmailLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Resend Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>

          <div className="flex items-center gap-3 mt-4">
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2 bg-white rounded-lg shadow px-4 py-2 border text-sm">
                <span className="font-medium">{selectedRows.length} Selected</span>
                <button className="action-btn" title="Duplicate">Duplicate</button>
                <button className="action-btn" title="Print">Print</button>
                <button className="action-btn" title="Delete">Delete</button>
                <button className="action-btn" title="Clear" onClick={() => setSelectedRows([])}>✕</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </DashboardLayout>
  );
};

export default SchoolAdminsPage; 