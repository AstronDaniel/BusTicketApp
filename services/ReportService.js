import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const ReportService = {
  addReport: async (reportData) => {
    try {
      const docRef = await addDoc(collection(db, 'reports'), reportData);
      console.log('Report added with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding report:', error);
      throw new Error('Failed to add report');
    }
  },

  generateAndStoreReport: async () => {
    const reportData = {
      title: 'Daily Report',
      date: new Date().toISOString(),
      content: 'This is an automatically generated report.'
    };

    try {
      await ReportService.addReport(reportData);
      console.log('Automatically generated report added successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
    }
  }
};

export default ReportService;
