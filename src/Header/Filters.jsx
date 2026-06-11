export default function Filters() {
    return (
        <div id="fileSearchFilters">
            <div className="parameterSearch">
                <h2>Date</h2>
                
                <div id="boundedInputs">
                    <h3>from:</h3>
                    <input type="date" name="dateFilterLowerBound"/>

                    <h3>to:</h3>
                    <input type="date" name="dateFilterUpperBound"/>
                </div>
            </div>

            <div id="filterBar"></div>

            <div className="parameterSearch">
                <h2>Size (MB)</h2>
                
                <div id="boundedInputs">
                    <h3>from:</h3>
                    <input type="number" name="sizeFilterLowerBound"/>

                    <h3>to:</h3>
                    <input type="number" name="sizeFilterUpperBound"/>
                </div>
            </div>

            <div id="filterBar"></div>

            <div className="parameterSearch">
                <h2>Extension:</h2>

                <select name="extensionFilter">
                    <option value=".pptx">.pptx</option>
                    <option value=".png">.png</option>
                    {/* SE VOR CITI TOATE FIȘIERELE ȘI SE VOR OBȚINE EXTENSIILE */}
                </select>
            </div>
        </div>
    )
}