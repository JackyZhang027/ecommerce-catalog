import React, { useState } from 'react';

import { cn } from '@/lib/utils';

const NumberInput = ({ value, onChange, disabled, placeholder = "0", className = "" }) => {

  const formatNumber = (num) => {
    if (!num) return '';
    const cleaned = num.replace(/\D/g, '');
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChange = (e) => {
    const input = e.target.value;
    const cleaned = input.replace(/\D/g, '');
    const formatted = formatNumber(cleaned);
    onChange(formatted, cleaned); // Pass both formatted and raw value
  };


  const handleKeyDown = (e) => {
    if ([8, 9, 27, 13, 46].includes(e.keyCode) ||
        (e.keyCode === 65 && e.ctrlKey) ||
        (e.keyCode === 67 && e.ctrlKey) ||
        (e.keyCode === 86 && e.ctrlKey) ||
        (e.keyCode === 88 && e.ctrlKey) ||
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };


  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      
        className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
        )}
      disabled={disabled}
    />
  );
};

export default NumberInput;