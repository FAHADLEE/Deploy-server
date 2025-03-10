import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import dayjs from "dayjs";
import { saveAs } from 'file-saver';
import { APIURL } from "../../../url";

const columns = [
    { field: "id", headerName: "Sno", width: 70 },
    { field: "status", headerName: "Status", width: 130 },
    { field: "bookingno", headerName: "Booking ID", width: 130 },
    { field: "tripid", headerName: "Tripsheet No", width: 130 },
    { field: "bookingdate", headerName: "Date", width: 130, valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY') },
    { field: "bookingtime", headerName: "Time", width: 90 },
    { field: "guestname", headerName: "Guest Name", width: 160 },
    { field: "mobileno", headerName: "Mobile", width: 130 },
    { field: "address1", headerName: "R.Address", width: 130 },
    { field: "streetno", headerName: "R.Address1", width: 130 },
    { field: "city", headerName: "R.Address2", width: 130 },
    { field: "customer", headerName: "Company", width: 130 },
    { field: "vehRegNo", headerName: "Vehicle No", width: 130 },
];

const usePending = () => {
    const apiUrl = APIURL;

    // const user_id = localStorage.getItem('useridno');
    const [rows, setRows] = useState([]);
    const [servicestation, setServiceStation] = useState("");
    const [fromDate, setFromDate] = useState(dayjs());
    const [toDate, setToDate] = useState(dayjs());
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [info, setInfo] = useState(false);
    const [warning, setWarning] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [popupOpen, setPopupOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState({});
    const [errorMessage, setErrorMessage] = useState({});
    const [warningMessage] = useState({});
    const [infoMessage] = useState({});

    //-------------popup-----------------

    const hidePopup = () => {
        setSuccess(false);
        setError(false);
        setInfo(false);
        setWarning(false);
    };
    useEffect(() => {
        if (error || success || warning || info) {
            const timer = setTimeout(() => {
                hidePopup();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success, warning, info]);
    //-------------------------------------------------------------

    const convertToCSV = (data) => {
        const header = columns.map((column) => column.headerName).join(",");
        const rows = data.map((row) => columns.map((column) => row[column.field]).join(","));
        return [header, ...rows].join("\n");
    };
    const handleExcelDownload = () => {
        const csvData = convertToCSV(rows);
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
        saveAs(blob, "Pending Reports.csv");
    };
    const handlePdfDownload = () => {
        const pdf = new jsPDF('Landscape');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text("Pending Reports", 10, 10);

        const tableData = rows.map((row) => [
            row['id'],
            row['status'],
            row['bookingno'],
            row['tripid'],
            row['bookingdate'],
            row['bookingtime'],
            row['guestname'],
            row['mobileno'],
            row['address1'],
            row['streetno'],
            row['customer'],
            row['vehRegNo'],
        ]);

        pdf.autoTable({
            head: [['Sno', 'Status', 'Booking ID', 'Tripsheet No', 'Date', 'Time', 'Guest Name', 'Mobile', 'R.Address', 'R.Address1', 'R.Address2', 'Company', 'Register NO']],
            body: tableData,
            startY: 20,
        });

        const pdfBlob = pdf.output('blob');
        saveAs(pdfBlob, 'Pending Reports.pdf');
    };

    const handleInputChange = (event, newValue) => {
        setServiceStation(newValue ? newValue.label : '');
    };

    const reversedRows = [...rows].reverse();

    const handleShow = useCallback(async () => {
        try {
            const response = await axios.get(
                `${apiUrl}/pending-bookings?servicestation=${encodeURIComponent(
                    servicestation
                )}&fromDate=${encodeURIComponent(fromDate.toISOString())}&toDate=${encodeURIComponent(
                    toDate.toISOString()
                )}`
            );
            const data = response.data;
            if (data.length > 0) {
                const rowsWithUniqueId = data.map((row, index) => ({
                    ...row,
                    id: index + 1,
                }));
                setRows(rowsWithUniqueId);
                setSuccess(true);
                setSuccessMessage("successfully listed")
            } else {
                setRows([]);
                setError(true);
                setErrorMessage("no data found")
            }
        } catch {
            setRows([]);
            setError(true);
            setErrorMessage("Check your Network Connection");
        }
    }, [servicestation, fromDate, toDate, apiUrl]);


    const handleShowAll = useCallback(async () => {
        try {
            const response = await axios.get(
                `${apiUrl}/booking`
            );
            const data = response.data;
            if (data.length > 0) {
                const rowsWithUniqueId = data.map((row, index) => ({
                    ...row,
                    id: index + 1,
                }));
                setRows(rowsWithUniqueId);
                setSuccess(true);
                setSuccessMessage("successfully listed")
            } else {
                setRows([]);
                setError(true);
                setErrorMessage("no data found")
            }
        } catch {
            setRows([]);
            setError(true);
            setErrorMessage("Check your Network Connection");
        }
    }, [apiUrl]);

    const handleButtonClick = (row) => {
        setSelectedRow(row);
        setPopupOpen(true);
    };
    const handlePopupClose = () => {
        setSelectedRow(null);
        setPopupOpen(false);
    };


    const handleTripsheetClick = () => {
        const bookingPageUrl = `/home/bookings/tripsheet?tripid=${selectedRow.tripid || ''}&bookingno=${selectedRow.bookingno || ''}&billingno=${selectedRow.billingno || ''}&apps=${selectedRow.apps || ''}&customer=${selectedRow.customer || ''}&orderedby=${selectedRow.orderedby || ''}&mobile=${selectedRow.mobile || ''}&guestname=${selectedRow.guestname || ''}&guestmobileno=${selectedRow.guestmobileno || ''}&email=${selectedRow.email || ''}&address1=${selectedRow.address1 || ''}&streetno=${selectedRow.streetno || ''}&city=${selectedRow.city || ''}&hireTypes=${selectedRow.hireTypes || ''}&department=${selectedRow.department || ''}&vehRegNo=${selectedRow.vehRegNo || ''}&vehType=${selectedRow.vehType || ''}&driverName=${selectedRow.driverName || ''}&mobileNo=${selectedRow.mobileNo || ''}&driversmsexbetta=${selectedRow.driversmsexbetta || ''}&gps=${selectedRow.gps || ''}&duty=${selectedRow.duty || ''}&pickup=${selectedRow.pickup || ''}&useage=${selectedRow.useage || ''}&request=${selectedRow.registerno || ''}&startdate=${selectedRow.startdate || ''}&closedate=${selectedRow.closedate || ''}&totaldays=${selectedRow.totaldays || ''}&employeeno=${selectedRow.employeeno || ''}&reporttime=${selectedRow.reporttime || ''}&starttime=${selectedRow.starttime || ''}&closetime=${selectedRow.closetime || ''}&additionaltime=${selectedRow.additionaltime || ''}&advancepaidtovendor=${selectedRow.advancepaidtovendor || ''}&customercode=${selectedRow.customercode || ''}&startkm=${selectedRow.startkm || ''}&closekm=${selectedRow.closekm || ''}&permit=${selectedRow.permit || ''}&parking=${selectedRow.parking || ''}&toll=${selectedRow.toll || ''}&vpermettovendor=${selectedRow.vpermettovendor || ''}&vendortoll=${selectedRow.vendortoll || ''}&customeradvance=${selectedRow.customeradvance || ''}&email1=${selectedRow.email1 || ''}&remark=${selectedRow.remark || ''}&smsguest=${selectedRow.smsguest || ''}&documentnotes=${selectedRow.documentnotes || ''}&VendorTripNo=${selectedRow.VendorTripNo || ''}&vehicles=${selectedRow.vehicles || ''}&duty1=${selectedRow.duty1 || ''}&startdate1=${selectedRow.startdate1 || ''}&closedate1=${selectedRow.closedate1 || ''}&totaldays1=${selectedRow.totaldays1 || ''}&locks=${selectedRow.locks || ''}&starttime2=${selectedRow.starttime2 || ''}&closetime2=${selectedRow.closetime2 || ''}&totaltime=${selectedRow.totaltime || ''}&startkm1=${selectedRow.startkm1 || ''}&closekm1=${selectedRow.closekm1 || ''}&totalkm1=${selectedRow.totalkm1 || ''}&remark1=${selectedRow.remark1 || ''}&caramount=${selectedRow.caramount || ''}&minkm=${selectedRow.minkm || ''}&minhrs=${selectedRow.minhrs || ''}&package=${selectedRow.package || ''}&amount=${selectedRow.amount || ''}&exkm=${selectedRow.exkm || ''}&amount1=${selectedRow.amount1 || ''}&exHrs=${selectedRow.exHrs || ''}&amount2=${selectedRow.amount2 || ''}&night=${selectedRow.night || ''}&amount3=${selectedRow.amount3 || ''}&driverconvenience=${selectedRow.driverconvenience || ''}&amount4=${selectedRow.amount4 || ''}&netamount=${selectedRow.netamount || ''}&vehcommission=${selectedRow.vehcommission || ''}&caramount1=${selectedRow.caramount1 || ''}&manualbills=${selectedRow.manualbills || ''}&pack=${selectedRow.pack || ''}&amount5=${selectedRow.amount5 || ''}&exkm1=${selectedRow.exkm1 || ''}&amount6=${selectedRow.amount6 || ''}&exHrs1=${selectedRow.exHrs1 || ''}&amount7=${selectedRow.amount7 || ''}&night1=${selectedRow.night1 || ''}&amount8=${selectedRow.amount8 || ''}&driverconvenience1=${selectedRow.driverconvenience1 || ''}&amount9=${selectedRow.amount9 || ''}&rud=${selectedRow.rud || ''}&netamount1=${selectedRow.netamount1 || ''}&discount=${selectedRow.discount || ''}&ons=${selectedRow.ons || ''}&manualbills1=${selectedRow.manualbills1 || ''}&balance=${selectedRow.balance || ''}&fcdate=${selectedRow.fcdate || ''}&taxdate=${selectedRow.taxdate || ''}&insdate=${selectedRow.insdate || ''}&stpermit=${selectedRow.stpermit || ''}&maintenancetype=${selectedRow.maintenancetype || ''}&kilometer=${selectedRow.kilometer || ''}&selects=${selectedRow.selects || ''}&documenttype=${selectedRow.documenttype || ''}&on1=${selectedRow.on1 || ''}&smsgust=${selectedRow.smsgust || ''}&booker=${selectedRow.booker || ''}&emailcheck=${selectedRow.emailcheck || ''}&valueprint=${selectedRow.valueprint || ''}&manualbillss=${selectedRow.manualbillss || ''}&reload=${selectedRow.reload || ''}`;
        window.location.href = bookingPageUrl;
    };
    const handleButtonbooking = () => {
        window.location.href = '/home/bookings/booking';
    };
    const handleButtontripsheet = () => {
        window.location.href = '/home/bookings/tripsheet';
    };

    return {
        error,
        success,
        info,
        warning,
        successMessage,
        errorMessage,
        warningMessage,
        infoMessage,
        hidePopup,
        fromDate,
        setFromDate,
        toDate,
        setToDate,
        handleShow,
        handleShowAll,
        servicestation,
        handleInputChange,
        handleButtonbooking,
        handleButtontripsheet,
        handleExcelDownload,
        handlePdfDownload,
        reversedRows,
        handleButtonClick,
        popupOpen,
        handlePopupClose,
        selectedRow,
        handleTripsheetClick,
        columns
    };
};

export default usePending;