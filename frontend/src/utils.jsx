import { toast } from 'react-toastify';

// show green success popup
export const handleSuccess = (msg) => {
  toast.success(msg, {
    position: 'top-right' // show in top right corner
  })
}

// show red error popup
export const handleError = (msg) => {
  toast.error(msg, {
    position: 'top-right' 
  })
}
