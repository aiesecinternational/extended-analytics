"use client"

import {useEffect, useState} from "react";
import {Input, Loader, Switch} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {useSearchParams} from "next/navigation";

export default function Export() {
    const givenUrl = useSearchParams().get("url");
    
    const [url, setUrl] = useState(givenUrl || "");
    const [loading, setLoading] = useState(false);
    const [dataAvailable, setDataAvailable] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState("");
    const [urlError, setUrlError] = useState("");
    const [modified, setModified] = useState(false);
    const [isUrlValid, setIsUrlValid] = useState(false);
    const [blob, setBlob] = useState<Blob|null>(null);
    const [shouldGetPeople, setShouldGetPeople] = useState(false);
    const [shouldGetApplications, setShouldGetApplications] = useState(true);
    
    
    useEffect(() => {
        if (url != "") {
            setModified(true);
        }
        validateUrl();
    }, [url])
    
    function validateUrl() {
        setUrlError("");
        
        if (url == "" || url == null) {
            setIsUrlValid(false);
            return false;
        }
        
        if (!url.includes("expa.aiesec.org/analytics")) {
            setUrlError("Invalid URL");
            setIsUrlValid(false);
            return false;
        }
        
        if (!url.includes("expa.aiesec.org/analytics/performance?")) {
            setUrlError("We only support performance analytics for now :(");
            setIsUrlValid(false);
            return false;
        }
        
        setIsUrlValid(true);
        return true;
    }
    
    async function getData() {
        setLoading(true);
        setDataAvailable(false);
        setUrlError("");
        const urlParams = url.split("expa.aiesec.org/analytics/performance?")[1];
        const formedUrl = `/api/export/performance-analytics?${urlParams}&getPeople=${shouldGetPeople}&getApplications=${shouldGetApplications}`;
        
        fetch(formedUrl).then(async (data) => {
            if (!data.ok) throw new Error("An error occurred while fetching data. Please try again.");
            
            const blob = new Blob([await data.blob()]);
            setBlob(blob);
            const downloadUrl = window.URL.createObjectURL(
                blob
            );
            setDataAvailable(true);
            setDownloadUrl(downloadUrl);
            setModified(false);
        }).catch((e) => {
            setUrlError("An error occurred while fetching data. Please try again.")
            notifications.show({
                title: "Error",
                message: "An error occurred while fetching data. Please try again",
                color: "red"
            })
            setModified(true);
        }).finally(() => {
            setLoading(false);
        });
    }
    
    async function copyToClipBoard() {
        await navigator.clipboard.writeText((await (blob as Blob).text()).replaceAll(",", "\t"));
        notifications.show({
            title: "Copied to clipboard",
            message: <div>You can now paste in a Google Sheet. Click <a className={'text-aiesec-blue underline'} href={"https://sheets.new"} target={"_blank"}>here</a> to create a new sheet</div>,
            color: "blue"
        })
    }
    
    function tryAgain() {
        setDataAvailable(false);
        setModified(true);
    }
    
    return (
        <div className={`flex flex-col items-center justify-center h-full w-full`}>
            <div className={`flex flex-col bg-white p-5 rounded-md space-y-5 max-w-3xl w-[600px] transition-all shadow-md ${loading ? `border-b-yellow` : dataAvailable ? "border-b-green" : urlError ? "border-b-red" : "border-b-aiesec-blue"} border-b-8 transition-all`}>
                <div className={`text-3xl font-bold text-gray`}>EXPA Analytics Export</div>
                
                { !dataAvailable && (
                    <div className={`flex flex-col space-y-5 items-start w-full`}>
                        <Input.Wrapper label="EXPA URL" description="Copy the URL from the EXPA analytics page" error={urlError} className={`w-full`}>
                            <Input placeholder="https://expa.aiesec.org/analytics/performance/..."
                                   className={`w-full transition-all`}
                                   value={url}
                                   onChange={(e) => {setUrl(e.target.value)}}
                                   disabled={loading}
                            />
                        </Input.Wrapper>
                        
                        { (modified && isUrlValid) && (
                            <div className={`flex flex-col space-y-5 w-full`}>
                                <div className={`flex flex-col space-y-3 p-2 pb-5 pt-3 text-gray w-full rounded-md bg-light-gray`}>
                                    <div className={`text-xs font-bold ${loading ? "opacity-50" : ""}`}>Select columns</div>
                                    <div className={`flex flex-row space-x-6`}>
                                        
                                        <Switch
                                            checked={shouldGetApplications}
                                            onChange={(e) => setShouldGetApplications(e.currentTarget.checked)}
                                            label={"Applications"}
                                            disabled={loading}
                                        />
                                        
                                        <Switch
                                            checked={shouldGetPeople}
                                            onChange={(e) => setShouldGetPeople(e.currentTarget.checked)}
                                            label={"People"}
                                            disabled={loading}
                                        />
                                    
                                    </div>
                                </div>
                                <button
                                    className={`${loading ? 'bg-yellow hover:opacity-100 hover:cursor-progress' : 'bg-aiesec-blue'} p-1 px-3 rounded-sm text-white font-bold flex flex-col
                                            items-center justify-center w-24 h-8
                                            disabled:bg-amber-50 disabled:hover:opacity-100
                                            hover:opacity-75 transition-all`}
                                    onClick={getData}
                                >
                                    {loading ? <Loader color="rgba(255, 255, 255, 1)" size={"xs"}/> : "Export"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                {dataAvailable && !modified && (
                    <div className={`flex flex-col space-y-5`}>
                        <div className={`text-xs text-gray opacity-50`}>{url}</div>
                        <div className={`flex flex-row justify-between`}>
                            <div className={`flex flex-row space-x-5`}>
                                <a className={`bg-green p-1 px-3 rounded-sm text-white font-bold transition-all hover:opacity-75`}
                                   href={downloadUrl} download="performance-analytics.csv">Download CSV</a>
                                <a className={`bg-green p-1 px-3 rounded-sm text-white font-bold transition-all hover:opacity-75 cursor-pointer`}
                                   onClick={copyToClipBoard}>Copy to Clipboard</a>
                            </div>
                            <a className={`bg-gray p-1 px-3 rounded-sm text-white font-bold transition-all hover:opacity-75 cursor-pointer`}
                               onClick={tryAgain}>Try again</a>
                        </div>
                    
                    </div>
                )}
            </div>
        
        </div>
    );
}
